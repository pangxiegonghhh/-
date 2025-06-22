import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Header } = Layout;

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

const AppHeader: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = parseJwt(token);
            if (payload && payload.sub) {
                axios.get(`/api/user_info/${payload.sub}`)
                    .then(res => {
                        setUser(res.data);
                    })
                    .catch(err => {
                        console.error("Failed to fetch user info", err);
                        if (err.response?.status === 401 || err.response?.status === 404) {
                            localStorage.removeItem("token");
                            navigate("/login");
                        }
                    });
            } else {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        message.success('已退出登录');
        navigate('/login');
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="profile">
                <Link to="/profile">个人中心</Link>
            </Menu.Item>
            <Menu.Item key="management">
                <Link to="/management">任务管理</Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" onClick={handleLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    return (
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="logo" style={{ marginRight: 50 }}>
                    <Link to="/tasks" style={{ color: '#d48806', fontSize: '20px', fontWeight: 'bold' }}>来组队</Link>
                </div>
                <Menu
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    style={{ borderBottom: 'none', lineHeight: '62px' }}
                    items={[
                        { key: '/tasks', label: <Link to="/tasks">任务大厅</Link> },
                        { key: '/management', label: <Link to="/management">任务管理</Link> }
                    ]}
                />
            </div>
            <div className="user-profile">
                {user ? (
                    <Dropdown overlay={userMenu} placement="bottomRight">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Avatar src={user.avatar_url} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                            <span>{user.name || user.username}</span>
                        </div>
                    </Dropdown>
                ) : (
                    <Button onClick={() => navigate('/login')}>登录</Button>
                )}
            </div>
        </Header>
    );
};

export default AppHeader; 