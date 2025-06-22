import React, { useEffect, useState } from "react";
import { Card, Input, Button, message, Avatar, Upload } from "antd";
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { Layout } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import type { UploadFile } from 'antd/es/upload';

const { Content } = Layout;

const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('图片大小必须小于 2MB!');
    }
    return isJpgOrPng && isLt2M;
};

const Profile: React.FC = () => {
    const [user, setUser] = useState<{ id: string; username: string; name: string; avatar_url?: string; phone: string; student_id: string; email: string } | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            message.warning("请先登录");
            navigate("/login");
            return;
        }
        const payload = parseJwt(token);
        if (payload && payload.sub) {
            axios.get(`/api/user_info/${payload.sub}`).then(res => {
                setUser(res.data);
                setName(res.data.name || "");
                setPhone(res.data.phone || "");
                setStudentId(res.data.student_id || "");
                setEmail(res.data.email || "");
            });
        }
    }, [navigate]);

    const handleUploadChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'done') {
            message.success(`${info.file.name} 上传成功`);
            const newAvatarUrl = info.file.response?.avatar_url;
            if (newAvatarUrl && user) {
                setUser({ ...user, avatar_url: newAvatarUrl });
            }
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} 上传失败`);
        }
    };

    const onSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await axios.post("/api/update_profile", {
                user_id: user.id,
                name,
                phone,
                student_id: studentId,
                email,
            });
            if (res.data.success) {
                message.success("保存成功");
            } else {
                message.error(res.data.message || "保存失败");
            }
        } catch {
            message.error("网络错误");
        }
        setSaving(false);
    };

    const onLogout = () => {
        localStorage.removeItem("token");
        message.success("已退出登录");
        navigate("/login");
    };

    function parseJwt(token: string) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null;
        }
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ background: '#fff', padding: 24, maxWidth: 600, margin: 'auto', borderRadius: 8 }}>
                    <Card
                        title={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Button
                                    type="link"
                                    style={{ padding: 0, marginRight: 12 }}
                                    onClick={() => navigate("/tasks")}
                                >
                                    返回
                                </Button>
                                <span>个人中心</span>
                            </div>
                        }
                    >
                        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <b style={{ flexShrink: 0 }}>头像：</b>
                            <Avatar size={64} src={user?.avatar_url} icon={<UserOutlined />} />
                            <Upload
                                name="avatar"
                                action="/api/upload_avatar"
                                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                                beforeUpload={beforeUpload}
                                onChange={handleUploadChange}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />}>更换头像</Button>
                            </Upload>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <b>名字：</b>
                            <Input style={{ width: 200 }} value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <b>手机号：</b>
                            <Input style={{ width: 200 }} value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <b>学号：</b>
                            <Input style={{ width: 200 }} value={studentId} onChange={e => setStudentId(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <b>邮箱：</b>
                            <Input style={{ width: 200 }} value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <Button type="primary" onClick={onSave} loading={saving} style={{ marginLeft: 8 }}>保存</Button>
                        <div style={{ marginBottom: 24 }}>
                            <b>账号：</b>{user?.username}
                        </div>
                        <Button type="primary" onClick={() => navigate('/management')} style={{ marginRight: 16 }}>
                            任务管理
                        </Button>
                        <Button danger onClick={onLogout}>退出登录</Button>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default Profile; 