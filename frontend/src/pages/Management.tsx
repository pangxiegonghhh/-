import React, { useEffect, useState } from "react";
import { Input, Button, message, List, Modal, Layout, Menu, Table, Avatar, Popconfirm, Tooltip } from "antd";
import { UserOutlined, LaptopOutlined } from '@ant-design/icons';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

const { Sider, Content } = Layout;

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

const Management: React.FC = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [published, setPublished] = useState<any[]>([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [formValues, setFormValues] = useState({ title: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [selectedKey, setSelectedKey] = useState('claimed');
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
            axios.get(`/api/my_roles/${payload.sub}`).then(res => {
                setRoles(res.data);
            });
            axios.get(`/api/my_published_tasks/${payload.sub}`).then(res => {
                setPublished(res.data);
            });
        }
    }, [navigate]);

    const finishTask = async (taskId: string) => {
        try {
            const res = await axios.post("/api/finish_task", { task_id: taskId });
            if (res.data.success) {
                message.success("任务已结束");
                setPublished(published => published.map(t => t.id === taskId ? { ...t, status: "已结束" } : t));
            } else {
                message.error(res.data.message || "结束失败");
            }
        } catch {
            message.error("网络错误");
        }
    };

    const showEditModal = (task: any) => {
        setEditingTask(task);
        setFormValues({ title: task.title, description: task.description });
        setIsEditModalVisible(true);
    };

    const handleUpdateTask = async () => {
        if (!editingTask) return;
        setSaving(true);
        try {
            const res = await axios.post("/api/update_task", {
                task_id: editingTask.id,
                title: formValues.title,
                description: formValues.description,
            });
            if (res.data.success) {
                message.success("任务更新成功");
                setPublished(published.map(t =>
                    t.id === editingTask.id ? { ...t, title: formValues.title, description: formValues.description } : t
                ));
                setIsEditModalVisible(false);
                setEditingTask(null);
            } else {
                message.error(res.data.message || "更新失败");
            }
        } catch {
            message.error("网络错误");
        }
        setSaving(false);
    };

    const memberColumns = [
        {
            title: "头像",
            dataIndex: "avatar_url",
            key: "avatar_url",
            render: (url: string) => <Avatar src={url} icon={<UserOutlined />} />,
        },
        {
            title: "姓名",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => text || record.username || "(未设置)",
        },
        {
            title: "学号",
            dataIndex: "student_id",
            key: "student_id",
        },
        {
            title: "手机号",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "邮箱",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "职责",
            dataIndex: "role_name",
            key: "role_name",
        },
        {
            title: "操作",
            key: "action",
            render: (_: any, record: any) => (
                <Popconfirm title="确定要移除该成员吗？" onConfirm={() => handleRemoveMember(record)} okText="是" cancelText="否">
                    <Button danger size="small">移除</Button>
                </Popconfirm>
            ),
        },
    ];

    const handleRemoveMember = async (member: any) => {
        try {
            await axios.post(`/api/task_roles/${member.role_id}/remove_member`);
            message.success("成员已移除");
            // 刷新数据
            const token = localStorage.getItem("token");
            const payload = token ? parseJwt(token) : null;
            if (payload && payload.sub) {
                axios.get(`/api/my_published_tasks/${payload.sub}`).then(res => {
                    setPublished(res.data);
                });
            }
        } catch {
            message.error("移除失败");
        }
    };

    const renderClaimedTasks = () => (
        <List
            header={<div>我认领的任务</div>}
            dataSource={roles.sort((a, b) => (a.status === "已结束" ? 1 : 0) - (b.status === "已结束" ? 1 : 0))}
            renderItem={item => (
                <List.Item>
                    <div>
                        <b>{item.title}</b> - {item.role_name} <span style={{ color: item.status === "已结束" ? "#888" : "#52c41a" }}>{item.status}</span>
                    </div>
                </List.Item>
            )}
        />
    );

    const renderPublishedTasks = () => (
        <List
            header={<div>我发布的任务</div>}
            dataSource={published.sort((a, b) => (a.status === "已结束" ? 1 : 0) - (b.status === "已结束" ? 1 : 0))}
            renderItem={item => (
                <List.Item
                    actions={[
                        item.status === "进行中" ? (
                            <>
                                <Button size="small" type="primary" style={{ marginRight: 8 }} onClick={() => navigate(`/task/${item.id}/dashboard`)}>管理</Button>
                                <Button size="small" style={{ marginRight: 8 }} onClick={() => showEditModal(item)}>编辑</Button>
                                <Button size="small" danger onClick={() => finishTask(item.id)}>结束任务</Button>
                            </>
                        ) : (
                            <span style={{ color: "#888" }}>已结束</span>
                        )
                    ]}
                >
                    <div>
                        <b>{item.title}</b> <span style={{ color: item.status === "已结束" ? "#888" : "#52c41a" }}>{item.status}</span>
                    </div>
                </List.Item>
            )}
        />
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Content style={{ padding: '24px 50px' }}>
                <Layout style={{ background: '#fff' }}>
                    <Sider width={200} style={{ background: '#fff' }}>
                        <Menu
                            mode="inline"
                            defaultSelectedKeys={['claimed']}
                            style={{ height: '100%', borderRight: 0 }}
                            onClick={(e) => setSelectedKey(e.key)}
                            items={[
                                { key: 'claimed', icon: <UserOutlined />, label: '我认领的任务' },
                                { key: 'published', icon: <LaptopOutlined />, label: '我发布的任务' },
                            ]}
                        />
                    </Sider>
                    <Content style={{ padding: '0 24px', minHeight: 280, background: '#fff' }}>
                        {selectedKey === 'claimed' ? renderClaimedTasks() : renderPublishedTasks()}
                    </Content>
                </Layout>
            </Content>
            <Modal
                title="编辑任务"
                open={isEditModalVisible}
                onOk={handleUpdateTask}
                onCancel={() => setIsEditModalVisible(false)}
                confirmLoading={saving}
                destroyOnClose
            >
                <Input
                    value={formValues.title}
                    onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                    style={{ marginBottom: 16 }}
                    placeholder="任务标题"
                />
                <Input.TextArea
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                    rows={4}
                    placeholder="任务描述"
                />
            </Modal>
        </Layout>
    );
};

export default Management; 