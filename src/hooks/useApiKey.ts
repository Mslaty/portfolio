import { useState, useCallback } from 'react'
import { getStoredApiKey, saveApiKey, deleteApiKey } from '../services/gemini'

export function useApiKey() {
  const [apiKey, setApiKey] = useState(getStoredApiKey)
  const [showKey, setShowKey] = useState(false)

  const hasKey = apiKey.trim().length > 0

  const save = useCallback(() => {
    saveApiKey(apiKey)
  }, [apiKey])

  const remove = useCallback(() => {
    deleteApiKey()
    setApiKey('')
    setShowKey(false)
  }, [])

  return { apiKey, setApiKey, showKey, setShowKey, hasKey, save, remove }
}
