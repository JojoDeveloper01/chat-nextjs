import { useEffect, useRef } from 'react';

type MessageInputProps = {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    handleSendMessage: () => void;
};

const MessageInput: React.FC<MessageInputProps> = ({ input, setInput, handleSendMessage }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="p-2">
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 p-3 rounded-lg border-[#2b7fff] border bg-secondary
                        text-text-primary placeholder:text-text-tertiary 
                        focus:outline-none focus:ring-2 focus:ring-[#2b7fff]"
                />
                <button
                    onClick={handleSendMessage}
                    className="px-2 py-3 bg-[#2b7fff] text-white rounded-lg 
                        hover:bg-[#2468cc] transition-all duration-100 
                        focus:outline-none focus:ring-2 focus:ring-[#2b7fff]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send-2"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" /><path d="M6.5 12h14.5" /></svg>
                </button>
            </div>
        </div>
    );
};

export default MessageInput;