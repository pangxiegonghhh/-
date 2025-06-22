import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Progress, Tabs, Button, Spin, Descriptions, message, Table, Modal, Form, Input, DatePicker, Popconfirm, List, Avatar, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TaskDashboard: React.FC = () => {
    const { id: taskId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<any>(null);
    const [subTasks, setSubTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);
    const [form] = Form.useForm();
    const [members, setMembers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [assignModal, setAssignModal] = useState<{ visible: boolean, subTask: any | null }>({ visible: false, subTask: null });
    const [assigning, setAssigning] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);

    const fetchSubTasks = () => {
        if (taskId) {
            axios.get(`/api/tasks/${taskId}/sub_tasks`)
                .then(res => setSubTasks(res.data))
                .catch(() => message.error('无法加载子任务列表'));
        }
    };

    useEffect(() => {
        if (taskId) {
            axios.get('/api/tasks').then(res => {
                const foundTask = res.data.find((t: any) => t.id === taskId);
                setTask(foundTask || null);
            }).finally(() => setLoading(false));
            fetchSubTasks();
        }
    }, [taskId]);

    useEffect(() => {
        if (taskId) {
            axios.get(`/api/task_roles/${taskId}`).then(res => setMembers(res.data));
        }
    }, [taskId, subTasks]);

    useEffect(() => {
        if (taskId) {
            axios.get(`/api/task_roles/${taskId}`).then(res => setRoles(res.data));
        }
    }, [taskId, members, subTasks]);

    const handleAddSubTask = () => {
        setEditingSubTask(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditSubTask = (record: any) => {
        setEditingSubTask(record);
        form.setFieldsValue({
            ...record,
            due_date: record.due_date ? dayjs(record.due_date) : null,
        });
        setIsModalVisible(true);
    };

    const handleDeleteSubTask = (subTaskId: string) => {
        axios.delete(`/api/tasks/${taskId}/sub_tasks/${subTaskId}`)
            .then(() => {
                message.success('子任务删除成功');
                fetchSubTasks();
            })
            .catch(() => message.error('子任务删除失败'));
    };

    const handleModalOk = () => {
        form.validateFields().then(values => {
            const request = editingSubTask
                ? axios.put(`/api/tasks/${taskId}/sub_tasks/${editingSubTask.id}`, values)
                : axios.post(`/api/tasks/${taskId}/sub_tasks`, values);

            request.then(() => {
                message.success(`子任务${editingSubTask ? '更新' : '创建'}成功`);
                setIsModalVisible(false);
                fetchSubTasks();
            }).catch(() => message.error(`子任务${editingSubTask ? '更新' : '创建'}失败`));
        });
    };

    const handleAssign = (subTask: any) => {
        setAssignModal({ visible: true, subTask });
        setSelectedMember(subTask.assignee_id || null);
    };

    const handleAssignOk = async () => {
        if (!assignModal.subTask) return;
        setAssigning(true);
        try {
            await axios.put(`/api/tasks/${taskId}/sub_tasks/${assignModal.subTask.id}`, {
                ...assignModal.subTask,
                assignee_id: selectedMember,
            });
            message.success('分配成功');
            setAssignModal({ visible: false, subTask: null });
            fetchSubTasks();
        } catch {
            message.error('分配失败');
        }
        setAssigning(false);
    };

    const columns = [
        { title: '任务名', dataIndex: 'title', key: 'title' },
        { title: '详情', dataIndex: 'description', key: 'description' },
        { title: 'DDL', dataIndex: 'due_date', key: 'due_date', render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
        { title: '完成状态', dataIndex: 'status', key: 'status' },
        { title: '所属组员', dataIndex: 'assignee_name', key: 'assignee_name', render: (name: string) => name && name.trim() ? name : '未分配' },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: any) => (
                <span>
                    <Button icon={<EditOutlined />} style={{ marginRight: 8 }} onClick={() => handleEditSubTask(record)}>编辑</Button>
                    <Button style={{ marginRight: 8 }} onClick={() => handleAssign(record)}>分配</Button>
                    <Popconfirm
                        title="确定要删除这个子任务吗？"
                        onConfirm={() => handleDeleteSubTask(record.id)}
                        okText="是"
                        cancelText="否"
                    >
                        <Button icon={<DeleteOutlined />} danger>删除</Button>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    const memberColumns = [
        {
            title: '头像',
            dataIndex: 'avatar_url',
            key: 'avatar_url',
            render: (url: string) => <Avatar src={url} icon={<UserOutlined />} />,
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => text || record.username || '(未设置)',
        },
        {
            title: '学号',
            dataIndex: 'student_id',
            key: 'student_id',
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '职责',
            dataIndex: 'role_name',
            key: 'role_name',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: any) => (
                <Popconfirm
                    title="确定要移除该成员吗？"
                    onConfirm={() => {
                        axios.post(`/api/task_roles/${record.role_id}/remove_member`).then(() => {
                            message.success('成员已移除');
                            axios.get(`/api/task_roles/${taskId}`).then(res => setMembers(res.data));
                            fetchSubTasks();
                        });
                    }}
                    okText="是"
                    cancelText="否"
                >
                    <Button danger size="small">移除</Button>
                </Popconfirm>
            ),
        },
    ];

    const rolesColumns = [
        { title: '职责', dataIndex: 'role_name', key: 'role_name' },
        { title: '认领人', key: 'user', render: (_: any, record: any) => record.name || record.username || '未认领' },
    ];

    if (loading || !task) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <AppHeader />
                <Content style={{ padding: '24px 50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
                    <Button onClick={() => navigate('/management')} style={{ marginBottom: 24 }}>返回任务管理</Button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <Title level={2}>{task.title}</Title>
                            <Descriptions column={1}>
                                <Descriptions.Item label="组长">{task.creator_name || task.creator_username}</Descriptions.Item>
                                <Descriptions.Item label="简介">{task.description}</Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Progress type="circle" percent={0} />
                            <Text style={{ display: 'block', marginTop: 8 }}>0 项紧急任务</Text>
                        </div>
                    </div>

                    <Tabs defaultActiveKey="1">
                        <TabPane tab="任务列表" key="1">
                            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSubTask}>添加任务</Button>
                            </div>
                            <Table columns={columns} dataSource={subTasks} rowKey="id" />
                        </TabPane>
                        <TabPane tab="成员列表" key="2">
                            <Table
                                columns={memberColumns}
                                dataSource={members.map((m: any) => ({ ...m, key: m.role_id }))}
                                pagination={false}
                                size="small"
                            />
                        </TabPane>
                        <TabPane tab="申请审核" key="3">
                            <p>这里将是申请审核列表...</p>
                        </TabPane>
                        <TabPane tab="职责分配" key="4">
                            <Table columns={rolesColumns} dataSource={roles} rowKey="role_id" />
                        </TabPane>
                    </Tabs>
                </div>
            </Content>
            <Modal
                title={editingSubTask ? '编辑子任务' : '添加子任务'}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="任务名" rules={[{ required: true, message: '请输入任务名' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="详情">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="due_date" label="DDL">
                        <DatePicker showTime />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="分配任务"
                open={assignModal.visible}
                onOk={handleAssignOk}
                onCancel={() => setAssignModal({ visible: false, subTask: null })}
                confirmLoading={assigning}
                destroyOnClose
            >
                <Select
                    style={{ width: 240 }}
                    placeholder="请选择成员"
                    value={selectedMember}
                    onChange={setSelectedMember}
                    allowClear
                >
                    {members.filter(m => m.user_id).map(m => (
                        <Select.Option key={m.user_id} value={m.user_id}>{m.name || m.username}</Select.Option>
                    ))}
                </Select>
            </Modal>
        </Layout>
    );
};

export default TaskDashboard; 