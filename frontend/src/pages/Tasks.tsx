import React, { useEffect, useState } from "react";
import { List, Input, Layout, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AppHeader from "../components/AppHeader";

const { Content } = Layout;

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/tasks").then(res => {
            setTasks(res.data);
            setFilteredTasks(res.data);
        });
    }, []);

    useEffect(() => {
        const lowercasedValue = searchTerm.toLowerCase();
        const filtered = tasks.filter(task =>
            task.title.toLowerCase().includes(lowercasedValue) ||
            (task.creator_name && task.creator_name.toLowerCase().includes(lowercasedValue)) ||
            task.creator_username.toLowerCase().includes(lowercasedValue)
        );
        setFilteredTasks(filtered);
    }, [searchTerm, tasks]);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Input.Search
                            placeholder="查找任务发布人或任务名"
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: 400 }}
                            enterButton
                        />
                        <Button type="primary" size="large" onClick={() => navigate("/new_task")}>
                            发布新任务
                        </Button>
                    </div>
                    <List
                        itemLayout="horizontal"
                        dataSource={filteredTasks}
                        renderItem={task => (
                            <List.Item
                                actions={[<Link to={`/task/${task.id}`}>查看详情</Link>]}
                            >
                                <List.Item.Meta
                                    title={task.title}
                                    description={
                                        <>
                                            <div>{task.description}</div>
                                            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '4px' }}>
                                                发布人: {task.creator_name || task.creator_username} | 发布于: {new Date(task.created_at).toLocaleString()}
                                            </div>
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default Tasks; 