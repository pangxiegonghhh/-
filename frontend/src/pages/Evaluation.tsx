import React, { useState } from "react";
import { List, Input, Button, Rate, message } from "antd";

// 示例评价数据
const initialEvaluations = [
    { id: 1, user: "张三", content: "配合很好！", rate: 5 },
    { id: 2, user: "李四", content: "完成及时", rate: 4 },
];

const Evaluation: React.FC = () => {
    const [evaluations, setEvaluations] = useState(initialEvaluations);
    const [user, setUser] = useState("");
    const [content, setContent] = useState("");
    const [rate, setRate] = useState(5);

    const addEvaluation = () => {
        if (!user || !content) return message.warning("请填写完整");
        setEvaluations([
            ...evaluations,
            { id: Date.now(), user, content, rate },
        ]);
        setUser("");
        setContent("");
        setRate(5);
    };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto" }}>
            <h2>队员评价</h2>
            <List
                dataSource={evaluations}
                renderItem={item => (
                    <List.Item>
                        <div style={{ width: "100%" }}>
                            <b>{item.user}</b>：{item.content} <Rate disabled value={item.rate} />
                        </div>
                    </List.Item>
                )}
            />
            <div style={{ marginTop: 24 }}>
                <Input
                    style={{ width: 120, marginRight: 8 }}
                    placeholder="你的名字"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                />
                <Input
                    style={{ width: 200, marginRight: 8 }}
                    placeholder="评价内容"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <Rate value={rate} onChange={setRate} style={{ marginRight: 8 }} />
                <Button type="primary" onClick={addEvaluation}>提交评价</Button>
            </div>
        </div>
    );
};

export default Evaluation; 