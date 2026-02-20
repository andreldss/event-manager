'use client';

import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Participant = { id: number; name: string };
type PaymentMonth = string;

type PaymentsMap = Record<string, number>;
type DraftMap = Record<string, string>;

function parseMonthInput(value: string): string | null {
    const match = (value || '').trim().match(/^(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const mm = Number(match[1]);
    const yyyy = Number(match[2]);

    if (mm < 1 || mm > 12) return null;

    return `${yyyy}-${String(mm).padStart(2, '0')}`; // YYYY-MM
}

function monthLabelPtBrWithYear(monthKey: string) {
    const [yStr, mStr] = (monthKey || '').split('-');
    const y = Number(yStr);
    const m = Number(mStr);

    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (!y || !m || m < 1 || m > 12) return monthKey;

    const yy = String(y).slice(-2);
    return `${labels[m - 1]}/${yy}`;
}

export default function CollectionsTab() {

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [payments, setPayments] = useState<PaymentsMap>({});
    const [draft, setDraft] = useState<DraftMap>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newParticipantName, setNewParticipantName] = useState('');
    const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

    const [paymentMonths, setPaymentMonths] = useState<PaymentMonth[]>([]);

    const [startMonthInput, setStartMonthInput] = useState('');
    const [termMonths, setTermMonths] = useState<12 | 24 | 36>(12);

    const MONTHS_PER_PAGE = 12;
    const [monthPage, setMonthPage] = useState(0);

    const exportRef = useRef<HTMLDivElement>(null);

    const params = useParams();
    const eventId = Number(params.id);

    function formatBRL(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function parseMoney(input: string) {
        const raw = input
            .replaceAll('.', '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '')
            .trim();

        if (!raw) return null;

        const n = Number(raw);
        if (Number.isNaN(n)) return null;
        if (n < 0) return null;
        return n;
    }

    function getKey(participantId: number, monthKey: string) {
        return `${participantId}|${monthKey}`;
    }

    function getValue(participantId: number, monthKey: string) {
        const key = getKey(participantId, monthKey);
        return payments[key] ?? 0;
    }

    function getDraftValue(participantId: number, monthKey: string) {
        const key = getKey(participantId, monthKey);

        if (draft[key] !== undefined) return draft[key];

        const v = getValue(participantId, monthKey);
        if (v === 0) return '';
        return String(v);
    }

    async function commitCell(participantId: number, monthKey: string) {
        const key = getKey(participantId, monthKey);
        const text = draft[key] ?? '';
        const parsed = parseMoney(text);

        setPayments(prev => {
            const next = { ...prev };

            if (parsed === null || parsed === 0) {
                delete next[key];
            } else {
                next[key] = parsed;
            }

            return next;
        });

        setDraft(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

        try {
            await apiFetch(`/events/${eventId}/collections`, 'PUT', {
                participantId,
                referenceMonth: monthKey,
                amount: parsed ?? 0
            });
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao salvar recolhimento.');
        }
    }

    async function addParticipant() {
        if (!eventId) return;

        const name = newParticipantName.trim();
        if (!name) return;

        setLoading(true);
        setError('');

        try {
            await apiFetch('/events/participants', 'POST', { eventId, name });
            setNewParticipantName('');
            await fetchParticipants();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Falha ao criar participante. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchParticipants() {
        if (!eventId) return;

        setLoading(true);
        setError('');

        try {
            const data = await apiFetch(`/events/${eventId}/participants`, 'GET');
            setParticipants(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Falha ao carregar participantes.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchCollections() {
        if (!eventId) return;

        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(`/events/${eventId}/collections`, 'GET');
            const map: PaymentsMap = {};

            for (const c of data) {
                const key = getKey(c.participantId, c.referenceMonth);
                map[key] = c.amount;
            }

            setPayments(map);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Falha ao carregar recolhimentos.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchPaymentsMonths() {
        if (!eventId) return;
        setLoading(true);
        setError('');

        try {
            const data = await apiFetch(`/events/${eventId}/event_payment_months`, 'GET');

            const months: PaymentMonth[] = Array.isArray(data)
                ? data
                    .filter((m) => typeof m === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(m))
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                : [];

            setPaymentMonths(months);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function generatePaymentMonths() {
        if (!eventId) return;

        const parsedStartMonth = parseMonthInput(startMonthInput);
        if (!parsedStartMonth) {
            setError('Informe o mês inicial no formato MM/AAAA (ex: 11/2026).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiFetch(`/events/${eventId}/event_payment_months`, 'POST', {
                startMonth: parsedStartMonth, // YYYY-MM
                termMonths
            });

            await fetchPaymentsMonths();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao gerar meses.');
        } finally {
            setLoading(false);
        }
    }

    const hasMonthsConfigured = paymentMonths.length > 0;

    const monthsToRender = paymentMonths.map((month) => ({
        key: month,
        label: monthLabelPtBrWithYear(month),
    }))

    const totalPages = Math.max(1, Math.ceil(monthsToRender.length / MONTHS_PER_PAGE));
    const shouldShowPager = monthsToRender.length > MONTHS_PER_PAGE;

    const visibleMonths = shouldShowPager
        ? monthsToRender.slice(
            monthPage * MONTHS_PER_PAGE,
            (monthPage + 1) * MONTHS_PER_PAGE
        )
        : monthsToRender;

    useEffect(() => {
        if (monthPage > totalPages - 1) setMonthPage(0);
    }, [monthsToRender.length, totalPages, monthPage]);

    function totalByParticipant(participantId: number) {
        let total = 0;

        for (const m of monthsToRender) {
            total += getValue(participantId, m.key);
        }

        return total;
    }

    function totalByMonth(monthKey: string) {
        let total = 0;

        for (const s of participants) {
            total += getValue(s.id, monthKey);
        }

        return total;
    }

    function totalGeneral() {
        let total = 0;

        for (const m of monthsToRender) {
            total += totalByMonth(m.key);
        }

        return total;
    }

    async function loadLogo() {
        try {
            const res = await fetch('/logo.png', { cache: 'no-store' });
            if (!res.ok) {
                setLogoDataUrl(null);
                return;
            }

            const blob = await res.blob();

            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('Falha ao ler logo.'));
                reader.onloadend = () => resolve(String(reader.result || ''));
                reader.readAsDataURL(blob);
            });

            setLogoDataUrl(dataUrl || null);
        } catch {
            setLogoDataUrl(null);
        }
    }

    async function exportPdf() {
        if (!exportRef.current) return;

        setError('');

        if (!logoDataUrl) {
            setError('Logo não carregou ainda.');
            return;
        }

        try {
            const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                scrollX: 0,
                scrollY: -window.scrollY,
                onclone: (doc) => {
                    const root = doc.getElementById('collections-export-root') as HTMLElement | null;
                    if (!root) return;

                    doc.body.style.background = '#ffffff';
                    doc.body.style.margin = '0';
                    doc.body.style.padding = '0';

                    root.style.backgroundColor = '#ffffff';
                    root.style.color = '#000000';
                    root.style.border = '0';
                    root.style.borderRadius = '0px';
                    root.style.margin = '0 auto';
                    root.style.width = 'fit-content';
                    root.style.maxWidth = 'none';

                    const wrap = doc.createElement('div');
                    wrap.style.background = '#ffffff';
                    wrap.style.padding = '24px';
                    wrap.style.display = 'flex';
                    wrap.style.justifyContent = 'center';

                    const parent = root.parentElement;
                    if (parent) {
                        parent.insertBefore(wrap, root);
                        wrap.appendChild(root);
                    }

                    const tables = root.querySelectorAll('table');
                    if (tables.length < 1) return;

                    const mainTable = tables[0].cloneNode(true) as HTMLTableElement;

                    const headRow = mainTable.querySelector('thead tr') as HTMLTableRowElement | null;
                    if (headRow && headRow.lastElementChild) {
                        headRow.lastElementChild.remove();
                    }

                    const bodyRows = mainTable.querySelectorAll('tbody tr');
                    bodyRows.forEach((tr) => {
                        const row = tr as HTMLTableRowElement;
                        if (row.lastElementChild) row.lastElementChild.remove();
                    });

                    const inputs = mainTable.querySelectorAll('input');
                    inputs.forEach((inp) => {
                        const input = inp as HTMLInputElement;
                        const span = doc.createElement('span');
                        const cs = doc.defaultView?.getComputedStyle(input);

                        span.textContent = input.value || '';
                        span.style.display = 'inline-block';
                        span.style.width = cs?.width || '60px';
                        span.style.padding = cs?.padding || '0';
                        span.style.fontSize = cs?.fontSize || '12px';
                        span.style.fontFamily = cs?.fontFamily || 'Arial';
                        span.style.fontWeight = cs?.fontWeight || '400';
                        span.style.lineHeight = cs?.lineHeight || 'normal';
                        span.style.textAlign = 'center';
                        span.style.color = '#111111';
                        span.style.backgroundColor = 'transparent';
                        span.style.border = '0';
                        span.style.verticalAlign = 'middle';

                        input.replaceWith(span);
                    });

                    const stickyEls = mainTable.querySelectorAll('[class*="sticky"]');
                    stickyEls.forEach((el) => {
                        const e = el as HTMLElement;
                        e.style.position = 'static';
                        e.style.left = 'auto';
                        e.style.top = 'auto';
                        e.style.zIndex = 'auto';
                    });

                    const header = doc.createElement('div');
                    header.style.display = 'flex';
                    header.style.alignItems = 'center';
                    header.style.justifyContent = 'space-between';
                    header.style.position = 'relative';
                    header.style.padding = '16px 18px';
                    header.style.background = '#ffffff';

                    const left = doc.createElement('div');
                    left.style.display = 'flex';
                    left.style.alignItems = 'center';
                    left.style.minWidth = '220px';

                    const logo = doc.createElement('img');
                    logo.src = logoDataUrl;
                    logo.style.width = '190px';
                    logo.style.height = '70px';
                    logo.style.objectFit = 'contain';

                    left.appendChild(logo);

                    const right = doc.createElement('div');
                    right.style.fontSize = '11px';
                    right.style.color = '#555555';
                    right.style.minWidth = '220px';
                    right.style.textAlign = 'right';
                    right.textContent = new Date().toLocaleString('pt-BR');

                    const title = doc.createElement('div');
                    title.textContent = 'Relatório de Recolhimentos';
                    title.style.position = 'absolute';
                    title.style.left = '50%';
                    title.style.transform = 'translateX(-50%)';
                    title.style.fontSize = '16px';
                    title.style.fontWeight = '700';
                    title.style.color = '#111111';
                    title.style.whiteSpace = 'nowrap';
                    title.style.pointerEvents = 'none';

                    header.appendChild(left);
                    header.appendChild(title);
                    header.appendChild(right);

                    const reportBox = doc.createElement('div');
                    reportBox.style.border = '1px solid #111111';
                    reportBox.style.background = '#ffffff';

                    const headerWrap = doc.createElement('div');
                    headerWrap.style.borderBottom = '1px solid #111111';
                    headerWrap.appendChild(header);

                    reportBox.appendChild(headerWrap);
                    reportBox.appendChild(mainTable);

                    while (root.firstChild) {
                        root.removeChild(root.firstChild);
                    }

                    root.appendChild(reportBox);

                    mainTable.style.borderCollapse = 'collapse';
                    mainTable.style.width = '100%';
                    mainTable.style.tableLayout = 'fixed';

                    const ths = mainTable.querySelectorAll('th');
                    ths.forEach((th) => {
                        const e = th as HTMLElement;
                        e.style.color = '#111111';
                        e.style.verticalAlign = 'middle';
                        e.style.paddingTop = '8px';
                        e.style.paddingBottom = '8px';
                        e.style.background = '#ffffff';
                    });

                    const cells = mainTable.querySelectorAll('th, td');
                    cells.forEach((cell) => {
                        const e = cell as HTMLElement;
                        e.style.color = '#111111';
                        e.style.verticalAlign = 'middle';
                        e.style.paddingTop = '6px';
                        e.style.paddingBottom = '6px';
                        e.style.borderTop = '0';
                        e.style.borderLeft = '0';
                        e.style.borderRight = '1px solid #111111';
                        e.style.borderBottom = '1px solid #111111';
                    });

                    const lastRowCells = mainTable.querySelectorAll('tbody tr:last-child td');
                    lastRowCells.forEach((cell) => {
                        (cell as HTMLElement).style.borderBottom = '0';
                    });

                    const lastColCells = mainTable.querySelectorAll('thead tr th:last-child, tbody tr td:last-child');
                    lastColCells.forEach((cell) => {
                        (cell as HTMLElement).style.borderRight = '0';
                    });

                    const allRows = mainTable.querySelectorAll('tr');
                    allRows.forEach((tr) => {
                        const rowCells = tr.querySelectorAll('th, td');

                        rowCells.forEach((cell, i) => {
                            const e = cell as HTMLElement;

                            if (i === 0) {
                                e.style.textAlign = 'left';
                                e.style.width = '240px';
                                e.style.paddingLeft = '12px';
                            } else {
                                e.style.textAlign = 'center';
                                e.style.whiteSpace = 'nowrap';
                                e.style.width = '70px';
                            }
                        });
                    });

                    const nodes = root.querySelectorAll('*');
                    nodes.forEach((node) => {
                        const e = node as HTMLElement;
                        const cs = doc.defaultView?.getComputedStyle(e);
                        if (!cs) return;

                        if (cs.color.includes('lab(') || cs.color.includes('lch(') || cs.color.includes('oklch(')) {
                            e.style.color = '#000000';
                        }

                        if (cs.backgroundColor.includes('lab(') || cs.backgroundColor.includes('lch(') || cs.backgroundColor.includes('oklch(')) {
                            e.style.backgroundColor = 'transparent';
                        }

                        if (cs.borderTopColor.includes('lab(') || cs.borderRightColor.includes('lab(') ||
                            cs.borderBottomColor.includes('lab(') || cs.borderLeftColor.includes('lab(')) {
                            e.style.borderColor = '#111111';
                        }
                    });
                }
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const margin = 8;
            const maxW = pageWidth - margin * 2;
            const maxH = pageHeight - margin * 2;

            const imgW = canvas.width;
            const imgH = canvas.height;

            const ratio = Math.min(maxW / imgW, maxH / imgH);

            const drawWidth = imgW * ratio;
            const drawHeight = imgH * ratio;

            const x = (pageWidth - drawWidth) / 2;
            const y = margin;

            pdf.addImage(imgData, 'PNG', x, y, drawWidth, drawHeight);

            pdf.save(`recolhimentos-evento-${eventId}.pdf`);
        } catch {
            setError('Falha ao gerar PDF.');
        }
    }

    useEffect(() => {
        if (!eventId) return;
        fetchParticipants();
        fetchCollections();
        fetchPaymentsMonths();
    }, [eventId]);

    useEffect(() => {
        loadLogo();
    }, []);

    const grandTotal = totalGeneral();

    return (
        <div className="flex flex-col gap-2 md:gap-3 w-full h-full min-h-0">

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
                <button
                    onClick={exportPdf}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
                    disabled={loading || participants.length === 0}
                >
                    Exportar PDF
                </button>

                <input
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Nome do aluno"
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-auto"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addParticipant();
                    }}
                    disabled={loading}
                />
                <button
                    onClick={addParticipant}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-white hover:opacity-90 cursor-pointer transition whitespace-nowrap disabled:opacity-60"
                    disabled={loading}
                >
                    + Aluno
                </button>
            </div>

            {error ? (
                <div className="text-xs text-red-600">
                    {error}
                </div>
            ) : null}

            {!hasMonthsConfigured ? (
                <div className="border rounded-xl bg-white flex flex-col flex-1 min-h-0 items-center justify-center p-6">
                    <div className="w-full max-w-md flex flex-col items-center gap-3">
                        <p className="font-semibold text-background">Configurar condições de pagamento</p>
                        <p className="text-sm text-gray-600 text-center">
                            Defina o mês inicial e o prazo em meses para gerar os meses de recolhimento dos alunos.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
                            <input
                                type="text"
                                value={startMonthInput}
                                onChange={(e) => setStartMonthInput(e.target.value)}
                                placeholder="MM/AAAA"
                                className="px-3 py-2 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-48 text-center"
                                disabled={loading}
                            />

                            <select
                                value={termMonths}
                                onChange={(e) => setTermMonths(Number(e.target.value) as 12 | 24 | 36)}
                                className="px-3 py-2 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-36 text-center"
                                disabled={loading}
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={36}>36</option>
                            </select>

                            <button
                                onClick={generatePaymentMonths}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-background text-white hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                                disabled={loading || !startMonthInput}
                            >
                                Gerar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    ref={exportRef}
                    id="collections-export-root"
                    className="border rounded-xl overflow-hidden bg-white flex flex-col flex-1 min-h-0"
                >
                    <div className="overflow-auto flex-1 min-h-0">

                        {shouldShowPager ? (
                            <div className="flex items-center justify-end gap-2 px-3 py-2 border-b bg-gray-50">
                                <button
                                    onClick={() => setMonthPage(p => Math.max(0, p - 1))}
                                    disabled={monthPage === 0}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &lt;&lt;
                                </button>

                                <span className="text-xs text-gray-600">
                                    {monthPage + 1} / {totalPages}
                                </span>

                                <button
                                    onClick={() => setMonthPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={monthPage >= totalPages - 1}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &gt;&gt;
                                </button>
                            </div>
                        ) : null}

                        <table className="w-full text-[11px] sm:text-xs min-w-max">
                            <thead className="bg-gray-50 border-b sticky top-0 z-20">
                                <tr>
                                    <th className="sticky left-0 z-30 bg-gray-50 text-left px-3 py-2 font-semibold text-background border-r w-40 sm:w-52 md:w-60">
                                        Aluno
                                    </th>

                                    {visibleMonths.map(m => (
                                        <th key={m.key} className="text-left px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
                                            {m.label}
                                        </th>
                                    ))}

                                    <th className="text-right px-3 py-2 font-semibold text-background whitespace-nowrap">
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {participants.map(p => (
                                    <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                                        <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r">
                                            {p.name}
                                        </td>

                                        {visibleMonths.map(m => (
                                            <td key={m.key} className="px-2 py-1.5">
                                                <input
                                                    value={getDraftValue(p.id, m.key)}
                                                    onChange={(e) => {
                                                        const key = getKey(p.id, m.key);
                                                        setDraft(prev => ({ ...prev, [key]: e.target.value }));
                                                    }}
                                                    onBlur={() => commitCell(p.id, m.key)}
                                                    className="w-15 px-1 py-0.5 rounded text-left text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-gray-200"
                                                    inputMode="decimal"
                                                    placeholder=""
                                                    disabled={loading}
                                                />
                                            </td>
                                        ))}

                                        <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                                            {formatBRL(totalByParticipant(p.id))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 border-t shrink-0">
                        <table className="w-full text-[11px] sm:text-xs min-w-max">
                            <tbody>
                                <tr>
                                    <td className="sticky left-0 bg-gray-50 px-3 py-2 border-r font-semibold text-background z-10 w-40 sm:w-52 md:w-60">
                                        Total por mês
                                    </td>

                                    {visibleMonths.map(m => (
                                        <td key={m.key} className="bg-gray-50 px-2 py-2 font-semibold text-background whitespace-nowrap">
                                            {formatBRL(totalByMonth(m.key))}
                                        </td>
                                    ))}

                                    <td className="bg-gray-50 px-3 py-2 text-right font-bold text-background whitespace-nowrap">
                                        {formatBRL(grandTotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}
