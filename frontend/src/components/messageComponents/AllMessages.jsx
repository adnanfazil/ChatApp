import { Fragment, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { VscCheckAll } from "react-icons/vsc";
import { CgChevronDoubleDown } from "react-icons/cg";
import {
    SimpleDateAndTime,
    SimpleDateMonthDay,
    SimpleTime,
} from "../../utils/formateDateTime";
import MediaMessage from "./MediaMessage";

const AllMessages = ({ allMessage }) => {
    const chatBox = useRef();
    const adminId = useSelector((store) => store.auth?._id);
    const isTyping = useSelector((store) => store?.condition?.isTyping);

    const [scrollShow, setScrollShow] = useState(true);
    
    // Handle Chat Box Scroll Down
    const handleScrollDownChat = () => {
        if (chatBox.current) {
            chatBox.current.scrollTo({
                top: chatBox.current.scrollHeight,
                // behavior: "auto",
            });
        }
    };
    
    // Scroll Button Hidden
    useEffect(() => {
        handleScrollDownChat();
        if (chatBox.current.scrollHeight == chatBox.current.clientHeight) {
            setScrollShow(false);
        }
        const handleScroll = () => {
            const currentScrollPos = chatBox.current.scrollTop;
            if (
                currentScrollPos + chatBox.current.clientHeight <
                chatBox.current.scrollHeight - 30
            ) {
                setScrollShow(true);
            } else {
                setScrollShow(false);
            }
        };
        const chatBoxCurrent = chatBox.current;
        chatBoxCurrent.addEventListener("scroll", handleScroll);
        return () => {
            chatBoxCurrent.removeEventListener("scroll", handleScroll);
        };
    }, [allMessage, isTyping]);

    // Get message content based on type
    const getMessageContent = (message) => {
        const messageType = message.messageType || 'text';
        const isOwn = message?.sender?._id === adminId;
    
        // Add debugging
        console.log('Message data:', {
            messageType,
            content: message.content,
            hasFileUrl: !!message.content?.fileUrl,
            fullMessage: message
        });
    
        if (messageType === 'text') {
            // Handle both new content structure and legacy message field
            const textContent = message.content?.text || message.message || '';
            return (
                <span className="text-text-primary">
                    {textContent}
                </span>
            );
        } else {
            // Handle media messages
            return (
                <MediaMessage
                    message={message}
                    isOwn={isOwn}
                />
            );
        }
    };

    // Check if message is media type
    const isMediaMessage = (message) => {
        const messageType = message.messageType || 'text';
        return ['image', 'video', 'audio', 'file'].includes(messageType);
    };

    return (
        <>
            {scrollShow && (
                <div
                    className="absolute bottom-16 right-4 cursor-pointer z-20 text-text-secondary bg-surface-elevated hover:bg-surface hover:text-text-primary p-2 rounded-full shadow-whatsapp transition-all duration-200 active:scale-95"
                    onClick={handleScrollDownChat}
                >
                    <CgChevronDoubleDown title="Scroll Down" fontSize={24} />
                </div>
            )}
            <div
                className="flex flex-col w-full px-3 gap-1 py-2 overflow-y-auto overflow-hidden scroll-style h-[66vh] bg-background"
                ref={chatBox}
            >
                {allMessage?.map((message, idx) => {
                    const isOwn = message?.sender?._id === adminId;
                    const isMedia = isMediaMessage(message);
                    
                    return (
                        <Fragment key={message._id}>
                            <div className="sticky top-0 flex w-full justify-center z-10">
                                {new Date(
                                    allMessage[idx - 1]?.updatedAt
                                ).toDateString() !==
                                    new Date(
                                        message?.updatedAt
                                    ).toDateString() && (
                                    <span className="text-xs font-medium mb-2 mt-1 text-text-secondary bg-surface-elevated h-7 w-fit px-4 rounded-full flex items-center justify-center cursor-pointer shadow-sm border border-border">
                                        {SimpleDateMonthDay(message?.updatedAt)}
                                    </span>
                                )}
                            </div>
                            <div
                                className={`flex items-start gap-2 ${
                                    isOwn
                                        ? "flex-row-reverse"
                                        : "flex-row"
                                }`}
                            >
                                {message?.chat?.isGroupChat &&
                                    !isOwn &&
                                    (allMessage[idx + 1]?.sender?._id !==
                                    message?.sender?._id ? (
                                        <img
                                            src={message?.sender?.image}
                                            alt=""
                                            className="h-8 w-8 rounded-full border border-border"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full"></div>
                                    ))}
                                <div
                                    className={`${
                                        isOwn
                                            ? "message-sent rounded-tl-lg rounded-tr-sm rounded-bl-lg rounded-br-lg"
                                            : "message-received rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg"
                                    } ${
                                        isMedia ? 'p-1' : 'py-2 px-3'
                                    } min-w-10 text-start flex flex-col relative max-w-[85%] shadow-sm`}
                                >
                                    {message?.chat?.isGroupChat &&
                                        !isOwn && (
                                            <span className={`text-xs font-semibold text-start text-whatsapp-primary mb-1 ${
                                                isMedia ? 'px-2 pt-1' : ''
                                            }`}>
                                                {message?.sender?.firstName}
                                            </span>
                                        )}
                                    <div
                                        className={`${
                                            isMedia ? '' : 'mb-1'
                                        } ${
                                            isOwn && !isMedia
                                                ? "pr-16"
                                                : !isMedia ? "pr-12" : ""
                                        }`}
                                    >
                                        {getMessageContent(message)}
                                        
                                        {/* Time and status for text messages */}
                                        {!isMedia && (
                                            <span
                                                className="text-[11px] font-light absolute bottom-1 right-2 flex items-end gap-1.5 text-text-secondary"
                                                title={SimpleDateAndTime(
                                                    message?.updatedAt
                                                )}
                                            >
                                                {SimpleTime(message?.updatedAt)}
                                                {isOwn && (
                                                    <VscCheckAll
                                                        className="text-whatsapp-primary"
                                                        fontSize={14}
                                                    />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Time and status for media messages */}
                                    {isMedia && (
                                        <div className="px-2 pb-1">
                                            <span
                                                className="text-[11px] font-light flex items-end gap-1.5 justify-end text-text-secondary"
                                                title={SimpleDateAndTime(
                                                    message?.updatedAt
                                                )}
                                            >
                                                {SimpleTime(message?.updatedAt)}
                                                {isOwn && (
                                                    <VscCheckAll
                                                        className="text-whatsapp-primary"
                                                        fontSize={14}
                                                    />
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Fragment>
                    );
                })}
                {isTyping && (
                    <div id="typing-animation" className="ml-2">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
            </div>
        </>
    );
};

AllMessages.propTypes = {
    allMessage: PropTypes.array.isRequired
};

export default AllMessages;
