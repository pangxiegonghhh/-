import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, Button, Spin, List, message } from "antd";
import axios from "axios";

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

const TaskDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<any[]>([]);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [creator, setCreator] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            message.warning("请先登录");
            navigate("/login");
            return;
        }

        if (id) {
            axios.get(`/api/tasks`).then(res => {
                const found = res.data.find((t: any) => t.id === id);
                setTask(found);
                setLoading(false);
                if (found && found.creator_id) {
                    axios.get(`/api/user_info/${found.creator_id}`).then(res2 => {
                        setCreator(res2.data);
                    });
                }
            });
            axios.get(`/api/task_roles/${id}`).then(res => {
                setRoles(res.data);
            });
            // 获取当前用户id
            if (token) {
                const payload = parseJwt(token);
                if (payload && payload.sub) setUserId(payload.sub);
            }
        }
    }, [id, navigate]);

    const claimRole = async (roleId: string) => {
        setClaiming(roleId);
        try {
            const res = await axios.post(`/api/claim_role`, { role_id: roleId, user_id: userId });
            if (res.data.success) {
                message.success("认领成功");
                // 刷新职责
                const res2 = await axios.get(`/api/task_roles/${id}`);
                setRoles(res2.data);
            } else {
                message.error(res.data.message || "认领失败");
            }
        } catch (err) {
            message.error("认领失败");
            console.error(err);
        }
        setClaiming(null);
    };

    if (loading) return <Spin style={{ margin: 40 }} />;
    if (!task) return <div>任务不存在</div>;

    return (
        <div style={{ maxWidth: 600, margin: "40px auto" }}>
            <Card title={task.title}>
                <p>{task.description}</p>
                {creator && (
                    <div style={{ marginBottom: 12, color: '#888' }}>
                        <span>发布人：{creator.name || '(未设置昵称)'}（账号：{creator.username}）</span>
                    </div>
                )}
                <h3>职责分配</h3>
                <List
                    dataSource={roles}
                    renderItem={item => (
                        <List.Item>
                            <span>{item.role_name}</span>
                            {item.user_id ? (
                                <span style={{ color: "#888", marginLeft: 16 }}>已被认领</span>
                            ) : userId ? (
                                <Button type="primary" size="small" loading={claiming === item.role_id} onClick={() => claimRole(item.role_id)}>
                                    认领
                                </Button>
                            ) : (
                                <span style={{ color: "#888", marginLeft: 16 }}>请登录后认领</span>
                            )}
                        </List.Item>
                    )}
                />
                <Button style={{ marginTop: 16 }}>
                    <Link to="/tasks">返回任务大厅</Link>
                </Button>
            </Card>
        </div>
    );
};

export default TaskDetail; 