/**
 * Auth Context
 * ==============
 * Manages authentication state using useReducer.
 * Provides login/logout/register actions and current user data.
 * Auto-loads user profile on mount if token exists.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authAPI } from '../api/auth'
import apiClient from '../api/client'

// ── State Shape ─────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,  // True until initial auth check completes
  error: null,
}

// ── Action Types ────────────────────────────────────────────
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER',
}

// ── Reducer ─────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    default:
      return state
  }
}

// ── Context ─────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ── Load user on mount (if token exists) ──────────────────
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      try {
        const { data } = await apiClient.get('/users/me')
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: data.data })
      } catch (error) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        dispatch({ type: AUTH_ACTIONS.LOGOUT })
      }
    }

    loadUser()
  }, [])

  // ── Actions ───────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    try {
      const { data } = await authAPI.login({ email, password })
      localStorage.setItem('access_token', data.data.access_token)
      localStorage.setItem('refresh_token', data.data.refresh_token)

      // Fetch user profile
      const { data: userData } = await apiClient.get('/users/me')
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData.data })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (formData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    try {
      const { data } = await authAPI.register(formData)
      localStorage.setItem('access_token', data.data.access_token)
      localStorage.setItem('refresh_token', data.data.refresh_token)
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data.data.user })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
  }, [])

  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData })
  }, [])

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
