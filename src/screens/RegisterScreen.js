// 导入必要的依赖
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { userApi } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

const RegisterScreen = ({ navigation }) => {
  // 状态管理
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [remark, setRemark] = useState('');
  const [avatar, setAvatar] = useState('');

  // 选择头像处理
  const handleSelectAvatar = async () => {
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
        setAvatar(selectedImage.uri);
      }
    } catch (error) {
      console.error('选择头像失败:', error);
      Alert.alert('Error', 'Failed to select avatar. Please try again.');
    }
  };

  // 注册处理
  const handleRegister = async () => {
    try {
      // 表单验证
      if (!username || !password || !nickname || !gender) {
        Alert.alert('Notice', 'Please fill in all required fields (Username, Password, Nickname, Gender)');
        return;
      }

      // 上传头像
      let avatarUrl = '';
      if (avatar) {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: avatar,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          });

          const uploadResponse = await userApi.uploadAvatar(formData);

          if (uploadResponse.code === 0) {
            avatarUrl = uploadResponse.data;
          } else {
            console.error('上传头像失败:', uploadResponse);
            Alert.alert('Notice', 'Avatar upload failed');
            return;
          }
        } catch (uploadError) {
          console.error('头像上传错误:', uploadError);
          Alert.alert('Notice', 'Avatar upload failed');
          return;
        }
      }

      // 调用注册API
      const response = await userApi.register({
        userName: username,
        password: password,
        nickName: nickname,
        sex: gender === 'male' ? 0 : gender === 'female' ? 1 : 2,
        remark: remark || 'User',
        avatar: avatarUrl,
      });

      // 检查响应状态
      if (response.code === 0 && response.data === "新增成功") {
        Alert.alert('Success', 'Registration successful', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        // 根据后端返回的错误信息显示提示
        const errorMessage = response.msg || response.data || 'Registration failed';
        Alert.alert(
          'Registration Failed', 
          errorMessage === "新增成功" ? 'Registration failed' : errorMessage
        );
      }
    } catch (error) {
      console.error('注册失败:', error);
      Alert.alert('Error', 'Registration failed. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        {/* 页面标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>New User Registration</Text>
        </View>

        <View style={styles.form}>
          {/* 用户名输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* 密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* 昵称输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nickname <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter nickname"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          {/* 性别选择 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 备注输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.remarkInput]}
              placeholder="Enter remarks"
              multiline
              numberOfLines={3}
              value={remark}
              onChangeText={setRemark}
            />
          </View>

          {/* 头像上传 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avatar</Text>
            <TouchableOpacity
              style={styles.avatarUpload}
              onPress={handleSelectAvatar}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatarImage}
                  onError={(error) => {
                    console.error('图片加载失败:', error);
                    Alert.alert('Notice', 'Failed to load image');
                  }}
                />
              ) : (
                <>
                  <View style={styles.uploadIcon}>
                    <Text style={styles.plusIcon}>+</Text>
                  </View>
                  <Text style={styles.uploadText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 按钮组 */}
        <View style={styles.bottomSpace}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4d4f',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  remarkInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  genderButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  genderButtonActive: {
    backgroundColor: '#e6f4ff',
    borderColor: '#1890ff',
  },
  genderText: {
    fontSize: 14,
    color: '#333',
  },
  genderTextActive: {
    color: '#1890ff',
  },
  bottomSpace: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 30,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  registerButton: {
    backgroundColor: '#1890ff',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  registerButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  avatarUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: '#fafafa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadIcon: {
    marginBottom: 4,
  },
  plusIcon: {
    fontSize: 24,
    color: '#999',
  },
  uploadText: {
    fontSize: 12,
    color: '#666',
  },
});

export default RegisterScreen; 