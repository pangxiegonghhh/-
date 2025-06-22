import React from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            // 这里的接口地址后端实现后再替换
            const res = await axios.post("/api/login", values);
            if (res.data.success) {
                localStorage.setItem("token", res.data.token); // 保存token
                message.success("登录成功！");
                // 登录成功后跳转到任务大厅
                navigate("/tasks");
            } else {
                message.error(res.data.message || "登录失败");
            }
        } catch (err) {
            message.error("网络错误");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto" }}>
            <h2>登录</h2>
            <Form onFinish={onFinish}>
                <Form.Item name="username" rules={[{ required: true, message: "请输入账号" }]}>
                    <Input placeholder="账号" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
                    <Input.Password placeholder="密码" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        登录
                    </Button>
                </Form.Item>
                <Form.Item>
                    没有账号？<Link to="/register">注册</Link>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Login; 