import React, { useState } from "react";
import { List, Progress as AntProgress, Button, Input, message } from "antd";

// 示例进度数据
const initialProgress = [
    { id: 1, content: "已完成任务设计", percent: 30 },
    { id: 2, content: "前端页面开发中", percent: 60 },
];

const Progress: React.FC = () => {
    const [progressList, setProgressList] = useState(initialProgress);
    const [input, setInput] = useState("");
    const [percent, setPercent] = useState(0);

    const addProgress = () => {
        if (!input) return message.warning("请输入进度内容");
        setProgressList([
            ...progressList,
            { id: Date.now(), content: input, percent },
        ]);
        setInput("");
        setPercent(0);
    };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto" }}>
            <h2>进度跟踪</h2>
            <List
                dataSource={progressList}
                renderItem={item => (
                    <List.Item>
                        <div style={{ width: "100%" }}>
                            <div>{item.content}</div>
                            <AntProgress percent={item.percent} />
                        </div>
                    </List.Item>
                )}
            />
            <div style={{ marginTop: 24 }}>
                <Input
                    style={{ width: 200, marginRight: 8 }}
                    placeholder="进度内容"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <Input
                    type="number"
                    style={{ width: 100, marginRight: 8 }}
                    placeholder="完成百分比"
                    value={percent}
                    onChange={e => setPercent(Number(e.target.value))}
                />
                <Button type="primary" onClick={addProgress}>添加进度</Button>
            </div>
        </div>
    );
};

export default Progress; 