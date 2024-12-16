import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { userApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  // 状态管理
  const { setIsLoggedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 登录处理函数
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Notice', 'Please enter username and password');
      return;
    }

    try {
      const response = await userApi.login({
        userName: username,
        password: password
      });

      if (response.code === 0) {
        const userData = response.data;
        // 检查用户状态
        if (userData.delFlag === 2 || !userData.status) {
          Alert.alert('Account Disabled', 'Your account has been disabled. Please contact administrator.');
          return;
        }

        // 保存登录凭证
        await AsyncStorage.setItem('token', userData.token || '');
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));

        // 如果选择记住密码,保存账号信息
        if (rememberMe) {
          const savedAccounts = await AsyncStorage.getItem('savedAccounts');
          let accounts = savedAccounts ? JSON.parse(savedAccounts) : [];

          const existingIndex = accounts.findIndex(acc => acc.userId === userData.userId);
          if (existingIndex >= 0) {
            accounts[existingIndex] = { ...userData, rememberMe: true };
          } else {
            accounts.push({ ...userData, rememberMe: true });
          }

          await AsyncStorage.setItem('savedAccounts', JSON.stringify(accounts));
        }

        setIsLoggedIn(true);
      } else {
        // 根据错误码显示不同的错误信息
        if (response.msg.includes('禁用')) {
          Alert.alert('Account Disabled', 'Your account has been disabled. Please contact administrator.');
        } else {
          Alert.alert('Login Failed', 'Invalid username or password');
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      Alert.alert('Error', error.message || 'Login failed. Please try again later.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/zhuye.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* 头部区域 */}
          <View style={styles.header}>
          <Image 
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.title}>My Library</Text>
            <Text style={styles.subtitle}>Creator: Chen</Text>
          </View>

          {/* 登录表单 */}
          <View style={styles.form}>
            {/* 用户名输入框 */}
            <View style={styles.inputContainer}>
              <Icon name="person" size={22} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* 密码输入框 */}
            <View style={styles.inputContainer}>
              <Icon name="lock" size={22} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* 记住密码和注册选项 */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Icon
                  name={rememberMe ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color="#fff"
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* 登录按钮 */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 半透明遮罩
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 40, // 添加圆角效果
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 25,
    paddingBottom: 5,
  },
  inputIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#fff',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 8,
  },
  rememberText: {
    color: '#fff',
    fontSize: 14,
  },
  registerText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;