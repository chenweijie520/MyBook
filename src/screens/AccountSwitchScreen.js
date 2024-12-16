import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const AccountSwitchScreen = ({ navigation }) => {
  // 状态管理
  const [accounts, setAccounts] = useState([]); // 保存的账号列表
  const [currentAccount, setCurrentAccount] = useState(null); // 当前账号
  const { setIsLoggedIn } = useAuth();

  // 组件加载时获取账号列表
  useEffect(() => {
    loadAccounts();
  }, []);

  // 加载保存的账号列表
  const loadAccounts = async () => {
    try {
      const savedAccountsStr = await AsyncStorage.getItem('savedAccounts');
      const currentUser = await AsyncStorage.getItem('userInfo');

      if (savedAccountsStr) {
        const parsedAccounts = JSON.parse(savedAccountsStr);
        // 获取所有记住密码且未被删除的账号
        const validAccounts = parsedAccounts.filter(account =>
          account.rememberMe &&
          !account.isDeleted
        );

        // 更新本地存储
        await AsyncStorage.setItem('savedAccounts', JSON.stringify(validAccounts));
        setAccounts(validAccounts);
      } else {
        setAccounts([]);
      }

      if (currentUser) {
        setCurrentAccount(JSON.parse(currentUser));
      }
    } catch (error) {
      console.error('加载账号列表失败:', error);
      setAccounts([]);
      setCurrentAccount(null);
    }
  };

  // 切换账号处理函数
  const handleSwitchAccount = async (account) => {
    try {
      // 更新账号列表中的激活状态
      const updatedAccounts = accounts.map(acc =>
        acc.userId === account.userId ? { ...acc, isActive: true } : { ...acc, isActive: false }
      );
      await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));

      // 更新当前用户信息
      await AsyncStorage.setItem('userInfo', JSON.stringify(account));
      await AsyncStorage.setItem('token', account.token);

      setCurrentAccount(account);
      navigation.goBack();

      // 延迟触发刷新
      setTimeout(() => {
        if (navigation.getParent()) {
          navigation.getParent().setParams({ refresh: Date.now() });
        }
      }, 100);
    } catch (error) {
      console.error('切换账号失败:', error);
      Alert.alert('Error', 'Failed to switch account. Please try again.');
    }
  };

  // 移除账号处理函数
  const handleRemoveAccount = async (accountToRemove) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this account?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const savedAccountsStr = await AsyncStorage.getItem('savedAccounts');
              let allAccounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];

              // 移除选中的账号
              const updatedAccounts = allAccounts.filter(account =>
                account.userId !== accountToRemove.userId
              );

              await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));

              // 如果移除的是当前账号
              if (accountToRemove.userId === currentAccount?.userId) {
                const rememberedAccounts = updatedAccounts.filter(account => account.rememberMe);
                if (rememberedAccounts.length > 0) {
                  await handleSwitchAccount(rememberedAccounts[0]);
                } else {
                  // 如果没有其他记住的账号则退出登录
                  await AsyncStorage.removeItem('token');
                  await AsyncStorage.removeItem('userInfo');
                  setIsLoggedIn(false);
                }
              }

              loadAccounts();

              // 通知其他页面刷新
              if (navigation.getParent()) {
                navigation.getParent().setParams({
                  refresh: Date.now(),
                  accountRemoved: accountToRemove.userId
                });
              }
            } catch (error) {
              console.error('移除账号失败:', error);
              Alert.alert('Error', 'Failed to remove account. Please try again.');
            }
          }
        }
      ]
    );
  };

  // 添加新账号处理函数
  const handleAddAccount = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userInfo');
    setIsLoggedIn(false);
  };

  // 渲染账号列表项
  const renderAccountItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.accountItem,
        currentAccount?.userId === item.userId && styles.accountItemActive
      ]}
      onPress={() => handleSwitchAccount(item)}
    >
      <View style={styles.accountInfo}>
        {item.avatar ? (
          <Image
//            source={{ uri: item.avatar.replace('localhost', '192.168.31.203') }}
            source={{ uri: item.avatar.replace('localhost', '192.168.43.166') }}
            style={styles.avatar}
            onError={() => {}}
          />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.accountTexts}>
          <Text style={styles.nickname}>{item.nickName}</Text>
          <Text style={styles.username}>{item.userName}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveAccount(item)}
      >
        <View style={styles.removeButtonContainer}>
          <Icon name="close" size={16} color="#999" />
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        keyExtractor={item => item.userId.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <Text style={styles.headerText}>Saved Accounts</Text>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No saved accounts</Text>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAccount}
      >
        <Text style={styles.addButtonText}>Add New Account</Text>
      </TouchableOpacity>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 15,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountItemActive: {
    borderColor: '#1890ff',
    borderWidth: 1,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  accountTexts: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  addButton: {
    margin: 15,
    backgroundColor: '#1890ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountSwitchScreen;