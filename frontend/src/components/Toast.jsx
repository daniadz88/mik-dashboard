import {useApp} from "../useApp";

const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
};

export default function Toast() {
    const {toasts} = useApp();
    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`${
                        colors[t.type] || colors.info
                    } text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-xs`}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}
