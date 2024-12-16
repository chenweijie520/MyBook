import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { userApi, bookApi } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

const ProfileScreen = ({ navigation, route }) => {
  // 状态管理
  const [userInfo, setUserInfo] = useState(null);
  const [borrowStats, setBorrowStats] = useState({
    current: 0,
    history: 0,
    favorite: 0
  });
  const { setIsLoggedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // 加载借阅统计数据
  const loadBorrowStats = async (userName) => {
    try {
      // 获取当前借阅数量
      const currentResponse = await bookApi.getBorrowList({
        pageNum: 1,
        pageSize: 1000,
        userName: userName,
        bookName: '',
        supplier: '',
        bookState: '1'  // 1表示借阅中
      });

      // 获取历史借阅数量
      const historyResponse = await bookApi.getBorrowList({
        pageNum: 1,
        pageSize: 1000,
        userName: userName,
        bookName: '',
        supplier: '',
        bookState: '0'  // 0表示已归还
      });

      if (currentResponse.code === 0 && historyResponse.code === 0) {
        const currentCount = currentResponse.data.data.list?.length || 0;
        const historyCount = historyResponse.data.data.list?.length || 0;
        const totalHistoryCount = currentCount + historyCount;

        setBorrowStats({
          current: currentCount,
          history: totalHistoryCount,
          favorite: 0
        });
      }
    } catch (error) {
      console.error('加载借阅统计失败:', error);
    }
  };

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (userInfoStr) {


      
        const user = JSON.parse(userInfoStr);
        if (user.avatar && user.avatar.includes('localhost')) {
//          user.avatar = user.avatar.replace('localhost', '192.168.31.203');
            user.avatar = user.avatar.replace('localhost', '192.168.43.166');
        }
        setUserInfo(user);
        setIsAdmin(user.authUser === 'Admin');
        await loadBorrowStats(user.userName);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  // 监听路由参数变化
  useEffect(() => {
    if (route.params?.refresh) {
      loadUserInfo();
    }
  }, [route.params?.refresh]);

  // 监听页面焦点
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserInfo();
    });

    return unsubscribe;
  }, [navigation]);

  // 初始加载
  useEffect(() => {
    loadUserInfo();
  }, []);

  // 退出登录处理
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userInfo');
              setIsLoggedIn(false);
            } catch (error) {
              console.error('退出登录失败:', error);
            }
          }
        }
      ]
    );
  };

  // 头像选择处理
  const handleAvatarPress = async () => {
    try {
      const options = {
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      };

      const result = await launchImageLibrary(options);
      if (!result.didCancel && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];

        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios'
            ? selectedImage.uri.replace('file://', '')
            : selectedImage.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });

        try {
          const uploadResponse = await userApi.uploadAvatar(formData);
          if (uploadResponse.code === 0) {
            const avatarUrl = uploadResponse.data;

            // 更新用户信息
            const updateData = {
              ...userInfo,
              userId: String(userInfo.userId),
              avatar: avatarUrl,
              sex: String(userInfo.sex),
              status: userInfo.status ? "1" : "0",
              delFlag: "0",
              remark: userInfo.remark || '',
              authUser: userInfo.authUser || 'User',
              loginDate: userInfo.loginDate,
              createTime: userInfo.createTime,
            };

            delete updateData.token;

            const updateResponse = await userApi.updateUserInfo(updateData);

            if (updateResponse.code === 0) {
              setUserInfo({
                ...userInfo,
                avatar: avatarUrl
              });

              // 更新本地存储
              try {
                await AsyncStorage.setItem('userInfo', JSON.stringify({
                  ...userInfo,
                  avatar: avatarUrl
                }));

                const savedAccountsStr = await AsyncStorage.getItem('savedAccounts');
                if (savedAccountsStr) {
                  const savedAccounts = JSON.parse(savedAccountsStr);
                  const updatedAccounts = savedAccounts.map(account => {
                    if (String(account.userId) === String(userInfo.userId)) {
                      return {
                        ...account,
                        avatar: avatarUrl
                      };
                    }
                    return account;
                  });
                  await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
                }

                Alert.alert('Success', 'Avatar updated successfully');
              } catch (storageError) {
                console.error('更新本地存储失败:', storageError);
              }
            } else {
              Alert.alert('Error', `Failed to update user info: ${updateResponse.msg}`);
            }
          } else {
            Alert.alert('Failed', `Avatar upload failed: ${uploadResponse.msg}`);
          }
        } catch (error) {
          console.error('上传/更新失败:', error);
          Alert.alert('Error', `Avatar upload failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // 菜单项配置
  const menuItems = [
    {
      title: 'My Favorites',
      icon: 'favorite',
      onPress: () => {} // 暂未实现
    },
    ...(isAdmin ? [
      {
        title: 'User Management',
        icon: 'people',
        onPress: () => navigation.navigate('UserManage')
      },
      {
        title: 'Book Management',
        icon: 'library-books',
        onPress: () => navigation.navigate('BookManage')
      }
    ] : []),
    {
      title: 'Borrowed Books',
      icon: 'book',
      onPress: () => navigation.navigate('BorrowInfo')
    },
    {
      title: 'Return History',
      icon: 'history',
      onPress: () => navigation.navigate('ReturnHistory')
    },
    {
      title: 'Switch Account',
      icon: 'swap-horiz',
      onPress: () => navigation.navigate('AccountSwitch')
    },
    {
      title: 'Logout',
      icon: 'logout',
      onPress: handleLogout
    },
  ];

  return (
    <View style={styles.container}>
      {/* 用户信息头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
        >
          {userInfo?.avatar ? (
            <Image
              source={{ uri: userInfo.avatar }}
              style={styles.avatar}
              onError={(error) => {
                console.error('头像加载失败:', error);
                setUserInfo(prev => ({
                  ...prev,
                  avatar: null
                }));
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Icon name="person" size={40} color="#ccc" />
            </View>
          )}
          <View style={styles.editAvatar}>
            <Icon name="camera-alt" size={14} color="#666" />
          </View>
        </TouchableOpacity>
        <Text style={styles.username}>{userInfo?.nickName || 'Username'}</Text>
        <Text style={styles.userInfo}>ID: {userInfo?.userId || ''}</Text>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{borrowStats.current}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{borrowStats.history}</Text>
          <Text style={styles.statLabel}>History</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{borrowStats.favorite}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={24} color="#666" style={styles.menuIcon} />
            <Text style={styles.menuText}>{item.title}</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatar: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  editAvatarText: {
    fontSize: 12,
    color: '#666',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 15,
    paddingVertical: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  adminMenuItem: {
    backgroundColor: '#f8f9fa',
  },
});

export default ProfileScreen; 