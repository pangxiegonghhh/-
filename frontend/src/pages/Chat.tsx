import React, { useState } from "react";
import { List, Input, Button } from "antd";

const Chat: React.FC = () => {
    const [messages, setMessages] = useState([
        { id: 1, user: "张三", content: "大家好！" },
        { id: 2, user: "李四", content: "你好！" },
    ]);
    const [user, setUser] = useState("");
    const [content, setContent] = useState("");

    const sendMessage = () => {
        if (!user || !content) return;
        setMessages([
            ...messages,
            { id: Date.now(), user, content },
        ]);
        setContent("");
    };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto" }}>
            <h2>即时通讯</h2>
            <List
                dataSource={messages}
                renderItem={item => (
                    <List.Item>
                        <b>{item.user}：</b>{item.content}
                    </List.Item>
                )}
                style={{ minHeight: 200, background: "#fafafa", marginBottom: 16 }}
            />
            <Input
                style={{ width: 120, marginRight: 8 }}
                placeholder="你的名字"
                value={user}
                onChange={e => setUser(e.target.value)}
            />
            <Input
                style={{ width: 300, marginRight: 8 }}
                placeholder="输入消息"
                value={content}
                onChange={e => setContent(e.target.value)}
                onPressEnter={sendMessage}
            />
            <Button type="primary" onClick={sendMessage}>发送</Button>
        </div>
    );
};

export default Chat; 