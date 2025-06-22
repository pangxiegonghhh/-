import React from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            // 这里的接口地址后端实现后再替换
            const res = await axios.post("/api/register", values);
            if (res.data.success) {
                message.success("注册成功，请登录！");
                navigate("/login");
            } else {
                if (res.data.message && res.data.message.includes("已存在")) {
                    message.error("账号重复，请更换！");
                } else {
                    message.error(res.data.message || "注册失败");
                }
            }
        } catch (err) {
            message.error("网络错误");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto" }}>
            <h2>注册</h2>
            <Form onFinish={onFinish}>
                <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
                    <Input placeholder="用户名" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
                    <Input.Password placeholder="密码" />
                </Form.Item>
                <Form.Item name="confirm" dependencies={['password']} rules={[
                    { required: true, message: "请确认密码" },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致!'));
                        },
                    }),
                ]}>
                    <Input.Password placeholder="确认密码" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        注册
                    </Button>
                </Form.Item>
                <Form.Item>
                    已有账号？<Link to="/login">登录</Link>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Register; 