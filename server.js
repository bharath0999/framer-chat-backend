import { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { callChatGPT } from "./chatgpt.js"

// Removed the default animated loader SVG function.

// ChatBubble component:
// - Renders an individual chat bubble.
// - When the assistant is loading, the bubble container loses its padding and background,
//   is forced to the avatar’s height, and displays either a text loader or an image loader.
function ChatBubble({
    role = "user",
    content,
    avatar,
    isLoading = false,
    bubbleBgColor,
    bubbleTextColor,
    bubbleFontSize,
    bubblePadding,
    avatarSize = 48,
    specialMargin = false,
    bubbleShadow,
    bubbleBorderWidth,
    bubbleBorderColor,
    // Loader customization for AI bubbles:
    aiLoaderType, // "Text" or "SVG Image"
    aiLoaderText,
    aiLoaderTextFontSize,
    aiLoaderTextColor,
    aiCustomLoaderSVG, // Used when aiLoaderType is "SVG Image"
}) {
    // Default container margin.
    const containerMargin = specialMargin ? "0" : "24px 0"

    // Base bubble style.
    let bubbleStyle = {
        display: "inline-block",
        alignSelf: "flex-start",
        maxWidth: "80%",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        backgroundColor: bubbleBgColor,
        color: bubbleTextColor,
        fontSize: `${bubbleFontSize}px`,
        fontFamily: "inherit",
        padding: `${bubblePadding}px`,
        borderRadius: "8px",
        lineHeight: "1.5",
        boxShadow: bubbleShadow || "none",
        border: bubbleBorderWidth
            ? `${bubbleBorderWidth}px solid ${bubbleBorderColor}`
            : "none",
    }

    // For AI bubbles in the loading state: remove padding and background,
    // force container height to match the AI avatar, and center the loader.
    if (role === "assistant" && isLoading) {
        bubbleStyle = {
            ...bubbleStyle,
            height: `${avatarSize}px`,
            padding: "0",
            backgroundColor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }
    }

    const styles = {
        container: {
            display: "flex",
            alignItems: "flex-start",
            margin: containerMargin,
            flexDirection: "row",
            width: "100%",
        },
        avatarContainer: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: "50%",
            overflow: "hidden",
            marginRight: "10px",
            flexShrink: 0,
        },
        avatarImage: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
        },
        bubble: bubbleStyle,
    }

    // Helper to insert a copy icon after any <a href="..."> link,
    // so the user can copy the URL.
    const addCopyIconToLinks = (htmlString) => {
        if (!htmlString || typeof htmlString !== "string") return htmlString
        const linkRegex = /<a href="([^"]+)"([^>]*)>(.*?)<\/a>/g
        // This appends a small clipboard icon that, when clicked,
        // uses the browser Clipboard API to copy the link (href) text.
        return htmlString.replace(
            linkRegex,
            `<a href="$1"$2>$3</a><span style="cursor:pointer; margin-left:4px;" onclick="navigator.clipboard.writeText('$1')">📋</span>`
        )
    }

    // Render loader if AI and loading; otherwise, render content (with optional copy icon for links).
    const renderContent = () => {
        if (role === "assistant" && isLoading) {
            if (aiLoaderType === "Text") {
                // Render a text loader that fits its content.
                return (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "4px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: `${aiLoaderTextFontSize}px`,
                                color: aiLoaderTextColor,
                            }}
                        >
                            {aiLoaderText}
                        </span>
                    </div>
                )
            } else if (aiLoaderType === "SVG Image") {
                // Render the uploaded SVG image at 80% of the AI avatar size.
                return (
                    <div
                        style={{
                            width: `${avatarSize * 0.8}px`,
                            height: `${avatarSize * 0.8}px`,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {aiCustomLoaderSVG ? (
                            <img
                                src={aiCustomLoaderSVG}
                                alt="Loading..."
                                style={{
                                    width: `${avatarSize * 0.8}px`,
                                    height: `${avatarSize * 0.8}px`,
                                    objectFit: "contain",
                                }}
                            />
                        ) : (
                            <div>Loading...</div>
                        )}
                    </div>
                )
            } else {
                return <div>Loading...</div>
            }
        }

        // If this is the assistant and not loading, insert copy icons after links
        if (role === "assistant") {
            const modifiedContent = addCopyIconToLinks(content)
            return <div dangerouslySetInnerHTML={{ __html: modifiedContent }} />
        }

        // Otherwise, just show user (or other) content as is
        return content
    }

    return (
        <div style={styles.container}>
            <div style={styles.avatarContainer}>
                {avatar ? (
                    <img
                        src={avatar}
                        alt={`${role} avatar`}
                        style={styles.avatarImage}
                    />
                ) : (
                    <div>{role === "user" ? "User" : "AI"}</div>
                )}
            </div>
            <div style={styles.bubble}>{renderContent()}</div>
        </div>
    )
}

// ChatInterface component:
// - Manages the overall chat interface, including message history, input field, and responsiveness.
// - The messages area is wrapped in an outer full‑width scroll container
//   so that the custom scrollbar spans the full page width while the inner content remains centered.
function ChatInterface({
    bgColor,
    topFrameClearButton,
    interfaceFontFamily,

    // Predefined Questions
    predefinedText1,
    predefinedText2,
    predefinedText3,
    predefinedFontColor,
    predefinedFontSize,
    predefinedBgColor,
    predefinedHoverColor,
    predefinedBorderColor,

    // User Bubble
    userBubbleBgColor,
    userBubbleTextColor,
    userBubbleFontSize,
    userBubblePadding,
    userAvatar,
    userAvatarSize,
    userBubbleBorderWidth,
    userBubbleBorderColor,
    // New User Bubble Shadow Customization:
    userBubbleShadowEnabled,
    userBubbleShadowColor,
    userBubbleShadowX,
    userBubbleShadowY,
    userBubbleShadowBlur,
    userBubbleShadowSpread,

    // AI Bubble
    aiBubbleBgColor,
    aiBubbleTextColor,
    aiBubbleFontSize,
    aiBubblePadding,
    aiAvatar,
    aiAvatarSize,
    aiBubbleBorderWidth,
    aiBubbleBorderColor,
    // New AI Bubble Shadow Customization:
    aiBubbleShadowEnabled,
    aiBubbleShadowColor,
    aiBubbleShadowX,
    aiBubbleShadowY,
    aiBubbleShadowBlur,
    aiBubbleShadowSpread,
    // New Loader properties for AI Bubble:
    aiLoaderType, // "Text" or "SVG Image"
    aiLoaderText,
    aiLoaderTextFontSize,
    aiLoaderTextColor,
    aiCustomLoaderSVG,
    // Input Field properties
    inputBgColor,
    inputBorderColor,
    inputBorderWidth,
    inputPlaceholderText,
    inputPlaceholderColor,
    inputHoverBgColor,
    inputHoverBorderColor,
    inputFocusBgColor,
    inputFocusBorderColor,
    inputFocusFontColor,
    // Send Button
    sendButton,
}) {
    const [messages, setMessages] = useState([])
    const [hidePredefined, setHidePredefined] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userInput, setUserInput] = useState("")
    const [isInputHovered, setIsInputHovered] = useState(false)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const messagesEndRef = useRef(null)
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    )

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    let topBarPadding = "16px"
    let bottomBarPaddingTop = "10px"
    let bottomBarPaddingBottom = "36px"
    if (windowWidth < 810) {
        topBarPadding = "8px"
        bottomBarPaddingTop = "6px"
        bottomBarPaddingBottom = "20px"
    } else if (windowWidth < 1200) {
        topBarPadding = "12px"
        bottomBarPaddingTop = "8px"
        bottomBarPaddingBottom = "28px"
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Modified handleSend: Insert an assistant placeholder for the loader.
    const handleSend = async (message) => {
        const content = message || userInput
        if (!content.trim()) return
        setMessages((prev) => [...prev, { role: "user", content }])
        setUserInput("")
        setHidePredefined(true)
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])
        setIsLoading(true)
        try {
            const aiResponse = await callChatGPT(content)
            setMessages((prev) => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: aiResponse,
                }
                return newMessages
            })
        } catch (error) {
            console.error("Error calling ChatGPT:", error)
            setMessages((prev) => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: "Error fetching response",
                }
                return newMessages
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearChat = () => {
        setMessages([])
        setHidePredefined(false)
        setUserInput("")
        setIsLoading(false)
    }

    const inputID = "chat-interface-input"
    const inputStyle = {
        flex: 1,
        padding: "10px",
        minWidth: "200px",
        borderRadius: "8px",
        fontSize: "16px",
        fontFamily: "inherit",
        backgroundColor: isInputFocused
            ? inputFocusBgColor
            : isInputHovered
            ? inputHoverBgColor
            : inputBgColor,
        border: `${inputBorderWidth}px solid ${
            isInputFocused
                ? inputFocusBorderColor
                : isInputHovered
                ? inputHoverBorderColor
                : inputBorderColor
        }`,
        color: isInputFocused ? inputFocusFontColor : "#000",
        outline: "none",
    }

    const placeholderCSS = `
        #${inputID}::placeholder {
            color: ${inputPlaceholderColor};
        }
    `

    const computedUserShadow = userBubbleShadowEnabled
        ? `${userBubbleShadowX}px ${userBubbleShadowY}px ${userBubbleShadowBlur}px ${userBubbleShadowSpread}px ${userBubbleShadowColor}`
        : "none"

    const computedAiShadow = aiBubbleShadowEnabled
        ? `${aiBubbleShadowX}px ${aiBubbleShadowY}px ${aiBubbleShadowBlur}px ${aiBubbleShadowSpread}px ${aiBubbleShadowColor}`
        : "none"

    const topBarStyles = {
        width: "100%",
        backgroundColor: bgColor,
        padding: topBarPadding,
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
    }

    const bottomBarStyles = {
        width: "100%",
        backgroundColor: bgColor,
        paddingTop: bottomBarPaddingTop,
        paddingBottom: bottomBarPaddingBottom,
        boxSizing: "border-box",
    }

    return (
        <div
            style={{
                fontFamily: interfaceFontFamily,
                backgroundColor: bgColor,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: placeholderCSS }} />
            {/* Custom Scrollbar CSS */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
          .scroll-outer {
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #F0F0F0 #FFFFFF;
          }
          .scroll-outer::-webkit-scrollbar {
            width: 12px;
          }
          .scroll-outer::-webkit-scrollbar-track {
            background: #FFFFFF;
            border-radius: 100px;
            margin-top: 6px;
            margin-bottom: 6px;
          }
          .scroll-outer::-webkit-scrollbar-thumb {
            background: #F0F0F0;
            border-radius: 100px;
          }
        `,
                }}
            />
            {/* TOP BAR */}
            <div style={topBarStyles}>
                {topFrameClearButton && (
                    <div onClick={handleClearChat}>{topFrameClearButton}</div>
                )}
            </div>
            {/* Outer full-width scroll container */}
            <div className="scroll-outer" style={{ flex: 1, width: "100%" }}>
                {/* Centered inner container with maxWidth */}
                <div
                    style={{
                        maxWidth: "800px",
                        margin: "0 auto",
                        padding: "0 " + topBarPadding,
                        boxSizing: "border-box",
                    }}
                >
                    {messages.map((msg, index) => {
                        const isLastMessage = index === messages.length - 1
                        const showLoader =
                            msg.role === "assistant" &&
                            isLastMessage &&
                            isLoading
                        return (
                            <ChatBubble
                                key={index}
                                role={msg.role}
                                content={msg.content}
                                avatar={
                                    msg.role === "user" ? userAvatar : aiAvatar
                                }
                                isLoading={showLoader}
                                bubbleBgColor={
                                    msg.role === "user"
                                        ? userBubbleBgColor
                                        : aiBubbleBgColor
                                }
                                bubbleTextColor={
                                    msg.role === "user"
                                        ? userBubbleTextColor
                                        : aiBubbleTextColor
                                }
                                bubbleFontSize={
                                    msg.role === "user"
                                        ? userBubbleFontSize
                                        : aiBubbleFontSize
                                }
                                bubblePadding={
                                    msg.role === "user"
                                        ? userBubblePadding
                                        : aiBubblePadding
                                }
                                avatarSize={
                                    msg.role === "user"
                                        ? userAvatarSize
                                        : aiAvatarSize
                                }
                                bubbleShadow={
                                    msg.role === "user"
                                        ? computedUserShadow
                                        : computedAiShadow
                                }
                                bubbleBorderWidth={
                                    msg.role === "user"
                                        ? userBubbleBorderWidth
                                        : aiBubbleBorderWidth
                                }
                                bubbleBorderColor={
                                    msg.role === "user"
                                        ? userBubbleBorderColor
                                        : aiBubbleBorderColor
                                }
                                aiLoaderType={aiLoaderType}
                                aiLoaderText={aiLoaderText}
                                aiLoaderTextFontSize={aiLoaderTextFontSize}
                                aiLoaderTextColor={aiLoaderTextColor}
                                aiCustomLoaderSVG={aiCustomLoaderSVG}
                            />
                        )
                    })}
                    {!hidePredefined && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                                marginTop: "12px",
                                marginBottom: "36px",
                            }}
                        >
                            <ChatBubble
                                role="assistant"
                                content="Hey there! How can I help you today?"
                                avatar={aiAvatar}
                                isLoading={false}
                                bubbleBgColor={aiBubbleBgColor}
                                bubbleTextColor={aiBubbleTextColor}
                                bubbleFontSize={aiBubbleFontSize}
                                bubblePadding={aiBubblePadding}
                                avatarSize={aiAvatarSize}
                                specialMargin={true}
                                bubbleShadow={computedAiShadow}
                                bubbleBorderWidth={aiBubbleBorderWidth}
                                bubbleBorderColor={aiBubbleBorderColor}
                                aiLoaderType={aiLoaderType}
                                aiLoaderText={aiLoaderText}
                                aiLoaderTextFontSize={aiLoaderTextFontSize}
                                aiLoaderTextColor={aiLoaderTextColor}
                                aiCustomLoaderSVG={aiCustomLoaderSVG}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    alignItems: "flex-start",
                                }}
                            >
                                {[
                                    predefinedText1,
                                    predefinedText2,
                                    predefinedText3,
                                ].map((text, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(text)}
                                        style={{
                                            fontFamily: "inherit",
                                            backgroundColor: predefinedBgColor,
                                            border: `1px solid ${predefinedBorderColor}`,
                                            color: predefinedFontColor,
                                            fontSize: `${predefinedFontSize}px`,
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "background-color 0.3s",
                                            width: "auto",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                predefinedHoverColor)
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                predefinedBgColor)
                                        }
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {/* BOTTOM BAR / INPUT FIELD */}
            <div style={bottomBarStyles}>
                <div
                    style={{
                        maxWidth: "800px",
                        margin: "0 auto",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        alignItems: "center",
                        padding: "0 16px",
                        boxSizing: "border-box",
                    }}
                >
                    <input
                        id={inputID}
                        type="text"
                        value={userInput}
                        placeholder={inputPlaceholderText}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        style={inputStyle}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onMouseEnter={() => setIsInputHovered(true)}
                        onMouseLeave={() => setIsInputHovered(false)}
                    />
                    {sendButton && (
                        <div onClick={() => handleSend()}>{sendButton}</div>
                    )}
                </div>
            </div>
        </div>
    )
}

// PROPERTY CONTROLS
addPropertyControls(ChatInterface, {
    // Global Background
    bgColor: { type: ControlType.Color, title: "Background" },
    // Top Bar Group
    topFrameSeparator: {
        type: ControlType.String,
        defaultValue: "––– Top Bar –––",
        title: " ",
        editable: false,
    },
    topFrameClearButton: {
        type: ControlType.ComponentInstance,
        title: "Clear Button",
    },
    // Global Font
    interfaceFontSeparator: {
        type: ControlType.String,
        defaultValue: "––– Interface Font –––",
        title: " ",
        editable: false,
    },
    interfaceFontFamily: {
        type: ControlType.Enum,
        title: "Global Font",
        options: [
            "Arial",
            "Helvetica",
            "Times New Roman",
            "Georgia",
            "Verdana",
        ],
        defaultValue: "Helvetica",
    },
    // Predefined Questions
    predefinedQuestionsSeparator: {
        type: ControlType.String,
        defaultValue: "––– Predefined Questions –––",
        title: " ",
        editable: false,
    },
    predefinedText1: { type: ControlType.String, title: "Text 1" },
    predefinedText2: { type: ControlType.String, title: "Text 2" },
    predefinedText3: { type: ControlType.String, title: "Text 3" },
    predefinedFontColor: { type: ControlType.Color, title: "Font Color" },
    predefinedFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 20,
    },
    predefinedBgColor: { type: ControlType.Color, title: "Button BG" },
    predefinedHoverColor: { type: ControlType.Color, title: "Hover BG" },
    predefinedBorderColor: { type: ControlType.Color, title: "Border" },
    // User Bubble Group
    userBubbleSeparator: {
        type: ControlType.String,
        defaultValue: "––– User Bubble –––",
        title: " ",
        editable: false,
    },
    userBubbleBgColor: { type: ControlType.Color, title: "BG Color" },
    userBubbleTextColor: { type: ControlType.Color, title: "Text Color" },
    userBubbleFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 24,
    },
    userBubblePadding: {
        type: ControlType.Number,
        title: "Padding",
        min: 8,
        max: 32,
    },
    userAvatar: { type: ControlType.Image, title: "Avatar" },
    userAvatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 48,
        min: 24,
        max: 128,
    },
    userBubbleBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        defaultValue: 0,
    },
    userBubbleBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    userBubbleShadowEnabled: {
        type: ControlType.Boolean,
        title: "Enable Shadow",
        defaultValue: false,
    },
    userBubbleShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        hidden: (props) => !props.userBubbleShadowEnabled,
    },
    userBubbleShadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -20,
        max: 20,
        hidden: (props) => !props.userBubbleShadowEnabled,
    },
    userBubbleShadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 2,
        min: -20,
        max: 20,
        hidden: (props) => !props.userBubbleShadowEnabled,
    },
    userBubbleShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 6,
        min: 0,
        max: 50,
        hidden: (props) => !props.userBubbleShadowEnabled,
    },
    userBubbleShadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: 0,
        min: 0,
        max: 20,
        hidden: (props) => !props.userBubbleShadowEnabled,
    },
    // AI Bubble Group
    aiBubbleSeparator: {
        type: ControlType.String,
        defaultValue: "––– AI Bubble –––",
        title: " ",
        editable: false,
    },
    aiBubbleBgColor: { type: ControlType.Color, title: "BG Color" },
    aiBubbleTextColor: { type: ControlType.Color, title: "Text Color" },
    aiBubbleFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 24,
    },
    aiBubblePadding: {
        type: ControlType.Number,
        title: "Padding",
        min: 8,
        max: 32,
    },
    aiAvatar: { type: ControlType.Image, title: "Avatar" },
    aiAvatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 48,
        min: 24,
        max: 128,
    },
    aiBubbleBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        defaultValue: 0,
    },
    aiBubbleBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    aiBubbleShadowEnabled: {
        type: ControlType.Boolean,
        title: "Enable Shadow",
        defaultValue: false,
    },
    aiBubbleShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        hidden: (props) => !props.aiBubbleShadowEnabled,
    },
    aiBubbleShadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -20,
        max: 20,
        hidden: (props) => !props.aiBubbleShadowEnabled,
    },
    aiBubbleShadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 2,
        min: -20,
        max: 20,
        hidden: (props) => !props.aiBubbleShadowEnabled,
    },
    aiBubbleShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 6,
        min: 0,
        max: 50,
        hidden: (props) => !props.aiBubbleShadowEnabled,
    },
    aiBubbleShadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: 0,
        min: 0,
        max: 20,
        hidden: (props) => !props.aiBubbleShadowEnabled,
    },
    // New AI Loader Options:
    aiLoaderType: {
        type: ControlType.Enum,
        title: "Loader Type",
        options: ["Text", "SVG Image"],
        defaultValue: "Text",
    },
    aiLoaderText: {
        type: ControlType.String,
        title: "Loader Text",
        defaultValue: "Thinking",
        hidden: (props) => props.aiLoaderType !== "Text",
    },
    aiLoaderTextFontSize: {
        type: ControlType.Number,
        title: "Loader Text Font Size",
        defaultValue: 14,
        min: 8,
        max: 30,
        hidden: (props) => props.aiLoaderType !== "Text",
    },
    aiLoaderTextColor: {
        type: ControlType.Color,
        title: "Loader Text Color",
        defaultValue: "#000000",
        hidden: (props) => props.aiLoaderType !== "Text",
    },
    aiCustomLoaderSVG: {
        type: ControlType.Image,
        title: "Loader SVG",
        hidden: (props) => props.aiLoaderType !== "SVG Image",
    },
    // Input Field Group
    inputFieldSeparator: {
        type: ControlType.String,
        defaultValue: "––– Input Field –––",
        title: " ",
        editable: false,
    },
    inputBgColor: {
        type: ControlType.Color,
        title: "BG Color (Default)",
        defaultValue: "#ffffff",
    },
    inputBorderColor: {
        type: ControlType.Color,
        title: "Border (Default)",
        defaultValue: "#ccc",
    },
    inputBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        defaultValue: 1,
    },
    inputPlaceholderText: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Ask me anything...",
    },
    inputPlaceholderColor: {
        type: ControlType.Color,
        title: "Placeholder Color",
        defaultValue: "#999",
    },
    inputHoverBgColor: {
        type: ControlType.Color,
        title: "BG (Hover)",
        defaultValue: "#f7f7f7",
    },
    inputHoverBorderColor: {
        type: ControlType.Color,
        title: "Border (Hover)",
        defaultValue: "#aaa",
    },
    inputFocusBgColor: {
        type: ControlType.Color,
        title: "BG (Focus)",
        defaultValue: "#ffffff",
    },
    inputFocusBorderColor: {
        type: ControlType.Color,
        title: "Border (Focus)",
        defaultValue: "#007AFF",
    },
    inputFocusFontColor: {
        type: ControlType.Color,
        title: "Font (Focus)",
        defaultValue: "#000",
    },
    // Send Button
    sendButton: { type: ControlType.ComponentInstance, title: "Send Button" },
})

export default ChatInterface
