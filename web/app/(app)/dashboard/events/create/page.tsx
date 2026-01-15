'use client';
import { useState } from "react";

export default function CreateEvent() {

    const [eventName, setEventName] = useState('');
    const [eventClient, setEventClient] = useState('');
    const [eventType, setEventType] = useState<'collective' | 'simple'>('simple');
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <div className="bg-background px-4 py-2 rounded-xl">
                <h1 className="font-bold text-[22px] text-white">Criar Evento</h1>
            </div>
            <div className="flex gap-10">
                <div className="flex flex-col gap-4">
                    <div>
                        <span className='text-sm text-gray-600'>Nome do Evento*</span>
                        <input
                            type='text'
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className='text-sm text-gray-600'>Tipo do Evento*</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEventType('collective')} className={`px-4 py-2 rounded-lg border transition cursor-pointer
                                ${eventType === 'collective'
                                    ? 'bg-background text-white'
                                    : 'bg-white px-4 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'}`}
                            >
                                Coletivo
                            </button>

                            <button type="button" onClick={() => setEventType('simple')} className={`px-4 py-2 rounded-lg border transition cursor-pointer
                                ${eventType === 'simple'
                                    ? 'bg-background text-white'
                                    : 'bg-white px-4 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'}`}
                            >
                                Simples
                            </button>
                        </div>
                    </div>
                    <div>
                        <span className='text-sm text-gray-600'>Cliente</span>
                        <input
                            type='text'
                            value={eventClient}
                            onChange={(e) => setEventClient(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                        />
                    </div>
                    <div>
                        <span className='text-sm text-gray-600'>Observações</span>
                        <textarea
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400 resize-none"
                            rows={5}
                        />
                    </div>
                </div>
                <div>
                    <h2>Datas e local</h2>
                    <div>
                        <span className='text-sm text-gray-600'>Observações</span>
                        <textarea
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400 resize-none"
                            rows={5}
                        />
                    </div>
                </div>
            </div> 
        </div>
    )
}