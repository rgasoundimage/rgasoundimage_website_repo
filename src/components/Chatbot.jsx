import { useState, useEffect, useRef } from "react";

export default function Chatbot() {
  /* =========================
     1. STATE
     ========================= */

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth - 80,
    y: window.innerHeight - 80,
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });  
  const [isCompleted, setIsCompleted] = useState(false);
  const [expecting, setExpecting] = useState(null); // "contact" | null
  const messagesEndRef = useRef(null);

  const [formData, setFormData] = useState({
    enquiryType: "",
    name: "",
    email: "",
    phone: "",
  });

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi, how may I help you today?",
      buttons: [
        "Cinema / Theatre Audio",
        "Commercial / Corporate AV",
        "Professional Audio Solutions",
        "General Enquiry",
      ],
    },
  ]);

  /* =========================
     2. AUTO-SCROLL
     ========================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     3. HANDLERS
     ========================= */

  const handleButtonClick = (option) => {
    setMessages((prev) => {
      const updated = [...prev];

      // remove buttons from last bot message
      const lastBotIndex = updated
        .map((m) => m.sender)
        .lastIndexOf("bot");

      if (lastBotIndex !== -1) {
        updated[lastBotIndex] = {
          ...updated[lastBotIndex],
          buttons: null,
        };
      }

      return [
        ...updated,
        { sender: "user", text: option },
        {
          sender: "bot",
          text:
            "Great 👍 Please share your name, email, and phone number and our team will contact you shortly.",
        },
      ];
    });

    setFormData((prev) => ({ ...prev, enquiryType: option }));
    setExpecting("contact");
  };

  const handleSend = () => {
    const { name, email, phone } = formData;

    // Show user input in chat
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: `Name: ${name || "-"}\nEmail: ${email || "-"}\nPhone: ${phone || "-"}`,
      },
    ]);

    // Validation
    if (!name || !email || !phone) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Please fill in all details so we can contact you 🙂",
        },
      ]);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanPhone = phone.replace(/\D/g, "");

    if (!emailRegex.test(email)) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Please enter a valid email address 📧",
        },
      ]);
      return;
    }

    if (cleanPhone.length < 10) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Please enter a valid 10-digit phone number 📞",
        },
      ]);
      return;
    }

    // Success
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text:
          "Thank you! ✅ Our team at RGA Sound Image will contact you shortly.",
      },
    ]);

    setFormData((prev) => ({ ...prev, phone: cleanPhone }));
    setExpecting(null);
    setIsCompleted(true);
  };

  const resetChatbot = () => {
    setMessages([
      {
        sender: "bot",
        text: "Hi, how may I help you today?",
        buttons: [
          "Cinema / Theatre Audio",
          "Commercial / Corporate AV",
          "Professional Audio Solutions",
          "General Enquiry",
        ],
      },
    ]);
  
    setFormData({
      enquiryType: "",
      name: "",
      email: "",
      phone: "",
    });
  
    setExpecting(null);
    setIsCompleted(false);
  };  
  

  /* =========================
     4. JSX
     ========================= */

     return (
        <>
          {/* Chat Button */}
          <button
            onClick={() => {
              if (isCompleted) resetChatbot();
              setIsOpen(!isOpen);
            }}
            style={chatButtonStyle}
          >
            💬
          </button>
      
          {/* Chat Window */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                }}
                onClick={() => setIsOpen(false)}
              />
      
              {/* Chat Window */}
              <div style={chatWindowStyle}>
                <div style={chatHeaderStyle}>RGA Sound Image</div>
      
                <div style={chatBodyStyle}>
                  {messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: "12px" }}>
                      <div
                        style={
                          msg.sender === "bot"
                            ? botMessageStyle
                            : userMessageStyle
                        }
                      >
                        {msg.text}
                      </div>
      
                      {msg.buttons && (
                        <div style={{ marginTop: "8px" }}>
                          {msg.buttons.map((btn, i) => (
                            <button
                              key={i}
                              style={optionButtonStyle}
                              onClick={() => handleButtonClick(btn)}
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
      
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
      
                {/* Input Area */}
                {expecting === "contact" && (
                  <div style={inputContainerStyleColumn}>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
      
                    <input
                      type="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
      
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
      
                    <button onClick={handleSend} style={sendButtonStyle}>
                      Submit
                    </button>
                  </div>
                )}
      
                {/* Cancel / New Request */}
                {isCompleted && (
                  <div style={inputContainerStyleColumn}>
                    <button
                      onClick={() => {
                        resetChatbot();
                        setIsOpen(false);
                      }}
                      style={cancelButtonStyle}
                    >
                      Close Chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      );
    } 

/* =========================
   5. STYLES
   ========================= */

   const chatButtonStyle = {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: 9999,
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    fontSize: "24px",
    border: "none",
    cursor: "pointer",
  };
  

  const chatWindowStyle = {
    position: "fixed",
    bottom: "80px",
    right: "16px",
    width: "320px",
    maxHeight: "70vh",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    zIndex: 10000, // ✅ CRITICAL FIX
  };  
  

const chatHeaderStyle = {
  padding: "12px",
  backgroundColor: "#111",
  color: "#fff",
  fontWeight: "600",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
};

const chatBodyStyle = {
    padding: "12px",
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch", // ✅ smooth mobile scroll
  };
  

const botMessageStyle = {
  backgroundColor: "#f1f1f1",
  padding: "8px 12px",
  borderRadius: "8px",
  maxWidth: "80%",
};

const userMessageStyle = {
  backgroundColor: "#111",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "8px",
  maxWidth: "80%",
  marginLeft: "auto",
  whiteSpace: "pre-line",
};

const optionButtonStyle = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "8px",
  backgroundColor: "#fff",
  border: "1px solid #111",
  borderRadius: "6px",
  cursor: "pointer",
};

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const sendButtonStyle = {
  padding: "10px",
  backgroundColor: "#111",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const inputContainerStyleColumn = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px",
  borderTop: "1px solid #ddd",
};

const cancelButtonStyle = {
    padding: "10px",
    backgroundColor: "#fff",
    color: "#111",
    border: "1px solid #111",
    borderRadius: "6px",
    cursor: "pointer",
  };
  