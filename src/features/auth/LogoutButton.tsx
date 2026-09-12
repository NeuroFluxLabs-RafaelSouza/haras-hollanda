import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

export function LogoutButton() {
  const navigate = useNavigate()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erro ao sair:', error.message)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <button
      type="button"
      className="sidebar__logout"
      onClick={handleLogout}
    >
      <LogOut size={16} strokeWidth={1.8} />
      <span>Sair</span>
    </button>
  )
}