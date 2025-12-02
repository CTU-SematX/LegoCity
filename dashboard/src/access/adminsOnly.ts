import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'
//TODO: Not working
type isAdmin = (args: AccessArgs<User>) => boolean

export const adminsOnly: isAdmin = ({ req: { user } }) => {
  return Boolean(user)
}
