type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function Tab({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
