import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BorrowInfoScreen from '../screens/BorrowInfoScreen';
import ReturnHistoryScreen from '../screens/ReturnHistoryScreen';
import AccountSwitchScreen from '../screens/AccountSwitchScreen';
import { useAuth } from '../context/AuthContext';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import BookManageScreen from '../screens/BookManageScreen';
import UserManageScreen from '../screens/UserManageScreen';

// 创建导航器实例
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 首页导航栈配置
const HomeStack = () => {
  return (
    <Stack.Navigator>
      {/* 首页 */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      {/* 搜索结果页 */}
      <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={{ title: 'Search Results' }}
      />
      {/* 图书详情页 */}
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ title: 'Book Details' }}
      />
    </Stack.Navigator>
  );
};

// 图书导航栈配置
const BookStack = () => {
  return (
    <Stack.Navigator>
      {/* 图书列表页 */}
      <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'Books' }} />
      {/* 图书详情页 */}
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details' }} />
    </Stack.Navigator>
  );
};

// 个人中心导航栈配置
const ProfileStack = () => {
  return (
    <Stack.Navigator>
      {/* 个人资料页 */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      {/* 借阅信息页 */}
      <Stack.Screen
        name="BorrowInfo"
        component={BorrowInfoScreen}
        options={{ title: 'Borrowed Books' }}
      />
      {/* 归还记录页 */}
      <Stack.Screen
        name="ReturnHistory"
        component={ReturnHistoryScreen}
        options={{ title: 'Return History' }}
      />
      {/* 账号切换页 */}
      <Stack.Screen
        name="AccountSwitch"
        component={AccountSwitchScreen}
        options={{ title: 'Switch Account' }}
      />
      {/* 图书管理页(管理员) */}
      <Stack.Screen
        name="BookManage"
        component={BookManageScreen}
        options={{ title: 'Book Management' }}
      />
      {/* 用户管理页(管理员) */}
      <Stack.Screen
        name="UserManage"
        component={UserManageScreen}
        options={{ title: 'User Management' }}
      />
    </Stack.Navigator>
  );
};

// 底部标签导航配置
const MainTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        // 配置标签栏样式
        tabBarActiveTintColor: '#1a73e8', // 激活状态的颜色
        tabBarInactiveTintColor: '#666', // 未激活状态的颜色
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        // 配置标签文字样式
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* 首页标签 */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      {/* 图书标签 */}
      <Tab.Screen
        name="BooksTab"
        component={BookStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Books',
          tabBarIcon: ({ color, size }) => (
            <Icon name="library-books" size={size} color={color} />
          ),
        }}
      />
      {/* 个人中心标签 */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// 主应用导航器组件
const AppNavigator = () => {
  // 使用认证上下文获取登录状态
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);

  // 检查登录状态的副作用
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 从本地存储获取登录凭证
        const token = await AsyncStorage.getItem('token');
        const userInfo = await AsyncStorage.getItem('userInfo');
        setIsLoggedIn(!!token && !!userInfo);
      } catch (error) {
        console.error('检查登录状态错误:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 加载状态时返回空
  if (loading) {
    return null;
  }

  // 渲染导航容器
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // 未登录状态显示的页面
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // 登录状态显示的页面
          <Stack.Screen name="MainTab" component={MainTab} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;