import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { MD5, enc } from 'crypto-js';

const BASE_URL = Platform.select({
   ios: 'http://127.0.0.1:8089/api/v1',
//   android: 'http://192.168.31.203:8089/api/v1',
   android: 'http://192.168.43.166:8089/api/v1',
});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  async config => {
    // 打印完整的请求信息
    console.log('Full Request:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      data: config.data,
      headers: config.headers
    });

    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.data);
    return response.data;
  },
  async error => {
    console.error('API Error:', error.response?.data || error);
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response;
      if (status === 401) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userInfo');
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    return Promise.reject(new Error('网络错误，请稍后重试'));
  }
);

// 与后端完全相同的 MD5 加密实现
const customMD5 = (data) => {
  try {
    // 使用已导入的 crypto-js 的 MD5
    const md = MD5(data);
    const array = md.words;
    let sb = '';
    
    // 模拟 Java 代码的处理方式
    for (let i = 0; i < array.length; i++) {
      const word = array[i];
      for (let shift = 24; shift >= 0; shift -= 8) {
        const byte = (word >> shift) & 0xFF;
        const hex = ((byte & 0xFF) | 0x100).toString(16).substring(1);
        sb += hex;
      }
    }
    
    return sb.toUpperCase();
  } catch (exception) {
    console.error('MD5 encryption error:', exception);
    return null;
  }
};



export const userApi = {
  login: (data) => {
    const encryptedPassword = customMD5(data.password);
    console.log('Login request:', { 
      userName: data.userName,
      rawPassword: data.password,
      encryptedPassword: encryptedPassword 
    });
    return api.post('/user/login', {
      userName: data.userName,
      password: encryptedPassword,
      code: data.code || ''
    });
  },
  register: (data) => {
    const encryptedPassword = customMD5(data.password);
    console.log('Register request data:', {
      ...data,
      rawPassword: data.password,
      encryptedPassword: encryptedPassword
    });

    const now = new Date().toISOString();
    return api.post('/user/register', {
      ...data,
      password: encryptedPassword,
      login_date: now,
      createTime: now,
      status: 1,
      delFlag: 0,
      authUser: '用户'
    });
  },
  updatePassword: (data) => {
    const encryptedPassword = customMD5(data.password);
    console.log('Update password request:', {
      userId: data.userId,
      rawPassword: data.password,
      encryptedPassword: encryptedPassword
    });
    return api.post('/user/updatePwd', {
      userId: String(data.userId),
      password: encryptedPassword
    });
  },
  updateUserInfo: (data) => {
    console.log('Update user info data:', data);
    return api.post('/user/update', data);
  },
  uploadAvatar: async (formData) => {
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        baseURL: Platform.select({
          ios: 'http://127.0.0.1:8089/api',
//          android: 'http://192.168.31.203:8089/api',
          android: 'http://192.168.43.166:8089/api',
        }),
        transformRequest: [(data) => data],
      });
      return response;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },
  getUserList: (params) => {
    return api.get('/user/list', {
      params: {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        userName: params.userName || '',
        nickName: params.nickName || ''
      }
    });
  },
  updateUserStatus: (userId, status) => {
    return api.get('/user/updateState', {
      params: {
        userId,
        status
      }
    });
  },
  deleteUser: (userId) => {
    return api.get('/user/delete', {
      params: {
        userId: userId
      }
    });
  },
  insertUser: (data) => {
    const encryptedPassword = customMD5(data.password);
    console.log('Insert user request:', {
      ...data,
      rawPassword: data.password,
      encryptedPassword: encryptedPassword
    });
    return api.post('/user/insert', {
      ...data,
      password: encryptedPassword
    });
  },
};

export const bookApi = {
  // 合并后的 getBookList 方法
  getBookList: (params) => {
    return api.get('/books/bookList', {
      params: {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        bookName: params.bookName || '',
        typeId: params.typeId || '',
        supplier: params.supplier || '',
      }
    });
  },

  // 修改获取图书详情的方法
  getBookDetail: (id) => {
    console.log('Getting book detail for id:', id);
    return api.get('/books/detail', {
      params: { id }
    }).then(response => {
      console.log('Book detail API response:', response);
      return response;
    });
  },

  // 借阅图书
  borrowBook: (params) => {
    console.log('Borrow request params:', params);
    return api.post('/books/borrowingBook', null, {
      params: {
        bookId: params.bookId,
        bookState: params.bookState,
        userName: params.userName,
        borrowId: params.borrowId || ''
      }
    });
  },

  // 获取借阅列表
  getBorrowList: (params) => {
    return api.get('/books/borrowList', {
      params: {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        userName: params.userName || '',
        bookName: params.bookName || '',
        supplier: params.supplier || '',
        bookState: params.bookState || ''
      }
    });
  },

  // 删除图书
  deleteBook: (bookId) => {
    return api.get('/books/delete', {
      params: { bookId }
    });
  },

  // 添加图书
  addBook: (bookData) => {
    return api.post('/books/add', bookData);
  },

  // 更新图书信息
  updateBook: (bookData) => {
    return api.post('/books/update', bookData);
  },

  // 添加图书相关的 API
  insertBook: (data) => {
    return api.post('/books/insertBook', data);
  },

  updateBook: (data) => {
    return api.post('/books/updateBook', data);
  },

  deleteBook: (id) => {
    return api.post('/books/deleteBook', null, {
      params: { id }
    });
  },

  updateShow: (id, booksShow) => {
    return api.post('/books/updateShow', null, {
      params: {
        id: id,
        booksShow: booksShow.toString()
      }
    });
  },

  uploadImage: (formData) => {
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      baseURL: Platform.select({
        ios: 'http://127.0.0.1:8089/api',
//        android: 'http://192.168.31.203:8089/api',
        android: 'http://192.168.43.166:8089/api',
      }),
    });
  }
};

export default api;