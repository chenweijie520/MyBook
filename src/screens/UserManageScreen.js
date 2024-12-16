// 导入必要的依赖
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { userApi } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const UserManageScreen = ({ navigation }) => {
  // 状态管理
  const { setIsLoggedIn } = useAuth();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchNickname, setSearchNickname] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const [newUser, setNewUser] = useState({
    userName: '',
    password: '',
    nickName: '',
    sex: 0,
    remark: '',
    authUser: 'User',
    delFlag: 0
  });

  // 加载用户列表
  const loadUsers = async (pageNum = 1) => {
    try {
      const response = await userApi.getUserList({
        pageNum: pageNum,
        pageSize: pageSize,
        userName: searchText,
        nickName: searchNickname
      });

      if (response.code === 0) {
        const newUsers = response.data.data.list || [];
        setUsers(pageNum === 1 ? newUsers : [...users, ...newUsers]);
        setHasMore(!response.data.data.isLastPage);
      } else {
        Alert.alert('Error', response.msg || 'Failed to get user list');
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      Alert.alert('Error', 'Failed to get user list');
    }
  };

  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadUsers(1);
    setRefreshing(false);
  };

  // 加载更多处理
  const handleLoadMore = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUsers(nextPage);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    setPage(1);
    loadUsers(1);
  };

  // 删除用户处理
  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // 检查是否是当前登录用户
              const currentUserStr = await AsyncStorage.getItem('userInfo');
              if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                if (parseInt(currentUser.userId) === parseInt(userId)) {
                  await AsyncStorage.clear();
                  setIsLoggedIn(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                  return;
                }
              }

              const response = await userApi.deleteUser(userId.toString());
              if (response.code === 0) {
                try {
                  // 删除本地存储中的账号记录
                  const savedAccountsStr = await AsyncStorage.getItem('savedAccounts');
                  if (savedAccountsStr) {
                    const savedAccounts = JSON.parse(savedAccountsStr);
                    const updatedAccounts = savedAccounts.filter(
                      account => parseInt(account.userId) !== parseInt(userId)
                    );
                    await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));

                    // 更新选中账号状态
                    const selectedAccountStr = await AsyncStorage.getItem('selectedAccount');
                    if (selectedAccountStr) {
                      const selectedAccount = JSON.parse(selectedAccountStr);
                      if (parseInt(selectedAccount.userId) === parseInt(userId)) {
                        await AsyncStorage.removeItem('selectedAccount');
                      }
                    }
                  }

                  Alert.alert('Success', 'User deleted successfully');
                  onRefresh();
                } catch (storageError) {
                  console.error('更新本地存储失败:', storageError);
                }
              } else {
                Alert.alert('Error', response.msg || 'Failed to delete user');
              }
            } catch (error) {
              console.error('删除用户失败:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  // 添加用户处理
  const handleAddUser = async () => {
    try {
      if (!newUser.userName || !newUser.password || !newUser.nickName) {
        Alert.alert('Notice', 'Please fill in all required fields (Username, Password, Nickname)');
        return;
      }

      const response = await userApi.insertUser(newUser);
      if (response.code === 0) {
        Alert.alert('Success', 'User added successfully');
        setModalVisible(false);
        setNewUser({
          userName: '',
          password: '',
          nickName: '',
          sex: 0,
          remark: '',
          authUser: 'User',
          delFlag: 0
        });
        onRefresh();
      } else {
        Alert.alert('Error', response.msg || 'Failed to add user');
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      Alert.alert('Error', 'Failed to add user');
    }
  };

  // 更新用户状态处理
  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const response = await userApi.updateUserStatus(userId, !status);
      if (response.code === 0) {
        Alert.alert('Success', 'User status updated successfully');
        onRefresh();
      } else {
        Alert.alert('Error', response.msg || 'Failed to update user status');
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  // 编辑用户处理
  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      password: '',
      sex: String(parseInt(user.sex)),
      delFlag: "0"
    });
    setEditModalVisible(true);
  };

  // 更新用户信息处理
  const handleUpdateUser = async () => {
    try {
      if (!editingUser.userName || !editingUser.nickName) {
        Alert.alert('Notice', 'Please fill in all required fields');
        return;
      }

      const updateData = {
        ...editingUser,
        userId: String(editingUser.userId),
        sex: String(editingUser.sex),
        status: editingUser.status ? "1" : "0",
        delFlag: "0",
        remark: editingUser.remark || '',
        authUser: editingUser.authUser || 'User',
        loginDate: editingUser.loginDate,
        createTime: editingUser.createTime
      };

      delete updateData.token;
      delete updateData.password;

      // 更新密码
      if (editingUser.password) {
        try {
          const passwordResponse = await userApi.updatePassword({
            userId: String(editingUser.userId),
            password: editingUser.password
          });
          if (passwordResponse.code !== 0) {
            Alert.alert('Error', passwordResponse.msg || 'Failed to update password');
            return;
          }
        } catch (error) {
          console.error('更新密码失败:', error);
          Alert.alert('Error', 'Failed to update password');
          return;
        }
      }

      // 更新用户信息
      const response = await userApi.updateUserInfo(updateData);
      if (response.code === 0) {
        try {
          // 更新本地存储
          const savedAccountsStr = await AsyncStorage.getItem('savedAccounts');
          if (savedAccountsStr) {
            const savedAccounts = JSON.parse(savedAccountsStr);
            const updatedAccounts = savedAccounts.map(account => {
              if (String(account.userId) === String(editingUser.userId)) {
                return {
                  ...account,
                  nickName: editingUser.nickName,
                  sex: String(editingUser.sex),
                  remark: editingUser.remark,
                  authUser: editingUser.authUser,
                  avatar: editingUser.avatar
                };
              }
              return account;
            });
            await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
          }

          // 更新当前用户信息
          const currentUserStr = await AsyncStorage.getItem('userInfo');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (String(currentUser.userId) === String(editingUser.userId)) {
              const updatedUser = {
                ...currentUser,
                nickName: editingUser.nickName,
                sex: String(editingUser.sex),
                remark: editingUser.remark,
                authUser: editingUser.authUser,
                avatar: editingUser.avatar
              };
              await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
            }
          }

          Alert.alert('Success', 'User information updated successfully');
          setEditModalVisible(false);
          setEditingUser(null);
          onRefresh();
        } catch (storageError) {
          console.error('更新本地存储失败:', storageError);
        }
      } else {
        Alert.alert('Error', response.msg || 'Failed to update user information');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      Alert.alert('Error', 'Failed to update user information');
    }
  };

  // 选择头像处理
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

            // 更新编辑中的用户头像
            setEditingUser({
              ...editingUser,
              avatar: avatarUrl
            });
          } else {
            Alert.alert('Failed', 'Avatar upload failed');
          }
        } catch (error) {
          console.error('上传头像失败:', error);
          Alert.alert('Error', 'Failed to upload avatar');
        }
      }
    } catch (error) {
      console.error('选择头像失败:', error);
      Alert.alert('Error', 'Failed to select avatar');
    }
  };

  // 初始加载
  useEffect(() => {
    loadUsers();
  }, []);

  // 渲染用户项
  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image
//              source={{ uri: item.avatar.replace('localhost', '192.168.31.203') }}
              source={{ uri: item.avatar.replace('localhost', '192.168.43.166') }}
              style={styles.avatar}
              onError={(error) => {
                console.error('加载头像失败:', error);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Icon name="person" size={30} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.userMainInfo}>
          <View style={styles.userTitleRow}>
            <Text style={styles.userName}>Username: {item.userName}</Text>
            <Text style={[styles.userStatus, { color: item.status ? '#51cf66' : '#ff6b6b' }]}>
              {item.status ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Text style={styles.userDetail}>Nickname: {item.nickName}</Text>
          <Text style={styles.userDetail}>
            Gender: {parseInt(item.sex) === 0 ? 'Male' : 'Female'}
          </Text>
          <Text style={styles.userDetail}>Role: {item.authUser}</Text>
          <Text style={styles.userDetail}>Remarks: {item.remark || 'None'}</Text>
          <Text style={styles.userDetail}>Created: {new Date(item.createTime).toLocaleString()}</Text>
          <Text style={styles.userDetail}>Last Login: {new Date(item.loginDate).toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleEditUser(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.status ? '#ff6b6b' : '#51cf66' }]}
          onPress={() => handleUpdateUserStatus(item.userId, item.status)}
        >
          <Text style={styles.actionButtonText}>
            {item.status ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff6b6b' }]}
          onPress={() => handleDeleteUser(item.userId)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search username"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nickname"
            value={searchNickname}
            onChangeText={setSearchNickname}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Icon name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 添加用户按钮 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add User</Text>
      </TouchableOpacity>

      {/* 用户列表 */}
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.userId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
      />

      {/* 添加用户模态框 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New User</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Username"
                value={newUser.userName}
                onChangeText={(text) => setNewUser({...newUser, userName: text})}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Password"
                secureTextEntry
                value={newUser.password}
                onChangeText={(text) => setNewUser({...newUser, password: text})}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Nickname"
                value={newUser.nickName}
                onChangeText={(text) => setNewUser({...newUser, nickName: text})}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1a73e8', marginBottom: 10 }]}
                onPress={() => setNewUser({...newUser, sex: newUser.sex === 0 ? 1 : 0})}
              >
                <Text style={styles.modalButtonText}>
                  Gender: {newUser.sex === 0 ? 'Male' : 'Female'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1a73e8', marginBottom: 10 }]}
                onPress={() => setNewUser({
                  ...newUser,
                  authUser: newUser.authUser === 'Admin' ? 'User' : 'Admin'
                })}
              >
                <Text style={styles.modalButtonText}>
                  Role: {newUser.authUser}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Remarks"
                value={newUser.remark}
                onChangeText={(text) => setNewUser({...newUser, remark: text})}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
                  onPress={() => {
                    setModalVisible(false);
                    setNewUser({
                      userName: '',
                      password: '',
                      nickName: '',
                      sex: 0,
                      remark: '',
                      authUser: 'User',
                      delFlag: 0
                    });
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#51cf66' }]}
                  onPress={handleAddUser}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit User</Text>

              <TouchableOpacity
                style={styles.avatarEditContainer}
                onPress={handleAvatarPress}
              >
                {editingUser?.avatar ? (
                  <Image
//                    source={{ uri: editingUser.avatar.replace('localhost', '192.168.31.203') }}
                    source={{ uri: editingUser.avatar.replace('localhost', '192.168.43.166') }}
                    style={styles.avatarLarge}
                  />
                ) : (
                  <View style={styles.avatarLarge}>
                    <Icon name="person" size={40} color="#ccc" />
                  </View>
                )}
                <View style={styles.editAvatarIcon}>
                  <Icon name="camera-alt" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              <TextInput
                style={[styles.modalInput, { backgroundColor: '#f5f5f5' }]}
                placeholder="Username"
                value={editingUser?.userName}
                editable={false}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="New password (leave empty if no change)"
                secureTextEntry
                value={editingUser?.password}
                onChangeText={(text) => setEditingUser({...editingUser, password: text})}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Nickname"
                value={editingUser?.nickName}
                onChangeText={(text) => setEditingUser({...editingUser, nickName: text})}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1a73e8', marginBottom: 10 }]}
                onPress={() => {
                  const newSex = parseInt(editingUser.sex) === 0 ? "1" : "0";
                  setEditingUser({
                    ...editingUser,
                    sex: newSex
                  });
                }}
              >
                <Text style={styles.modalButtonText}>
                  Gender: {parseInt(editingUser?.sex) === 0 ? 'Male' : 'Female'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1a73e8', marginBottom: 10 }]}
                onPress={() => setEditingUser({
                  ...editingUser,
                  authUser: editingUser.authUser === 'Admin' ? 'User' : 'Admin'
                })}
              >
                <Text style={styles.modalButtonText}>
                  Role: {editingUser?.authUser}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Remarks"
                value={editingUser?.remark}
                onChangeText={(text) => setEditingUser({...editingUser, remark: text})}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingUser(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#51cf66' }]}
                  onPress={handleUpdateUser}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchButton: {
    backgroundColor: '#1a73e8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
    margin: 10,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  userItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMainInfo: {
    flex: 1,
  },
  userTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    position: 'absolute',
    right: '30%',
    bottom: 0,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default UserManageScreen;