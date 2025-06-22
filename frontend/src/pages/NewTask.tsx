import React, { useState } from "react";
import { Form, Input, Button, message, InputNumber, Space } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

const NewTask: React.FC = () => {
    const navigate = useNavigate();
    const [teamSize, setTeamSize] = useState(1);
    const [roles, setRoles] = useState<string[]>([""]);

    const onTeamSizeChange = (value: number | null) => {
        const v = value || 1;
        setTeamSize(v);
        setRoles(Array(v).fill("").map((val, i) => roles[i] || ""));
    };

    const onRoleChange = (idx: number, value: string) => {
        setRoles(r => r.map((item, i) => (i === idx ? value : item)));
    };

    const onFinish = async (values: any) => {
        try {
            // 从本地存储获取token并解析用户id
            const token = localStorage.getItem("token");
            let creator_id = "00000000-0000-0000-0000-000000000000";
            if (token) {
                const payload = parseJwt(token);
                if (payload && payload.sub) creator_id = payload.sub;
            }
            const res = await axios.post("/api/tasks", {
                ...values,
                creator_id,
                team_size: teamSize,
                roles
            });
            if (res.data.success) {
                message.success("任务发布成功！");
                navigate("/tasks");
            } else {
                message.error(res.data.message || "发布失败");
            }
        } catch (err) {
            message.error("网络错误");
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "40px auto" }}>
            <h2>发布新任务</h2>
            <Form onFinish={onFinish}>
                <Form.Item name="title" label="任务标题" rules={[{ required: true, message: "请输入任务标题" }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="任务描述" rules={[{ required: true, message: "请输入任务描述" }]}>
                    <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item label="组队人数">
                    <InputNumber min={1} max={10} value={teamSize} onChange={onTeamSizeChange} />
                </Form.Item>
                <Form.Item label="职责名称">
                    <Space direction="vertical" style={{ width: "100%" }}>
                        {Array.from({ length: teamSize }).map((_, idx) => (
                            <Input
                                key={idx}
                                placeholder={`职责${idx + 1}`}
                                value={roles[idx] || ""}
                                onChange={e => onRoleChange(idx, e.target.value)}
                                required
                            />
                        ))}
                    </Space>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        发布
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default NewTask; 