import { auth } from "@/server/auth"
 
export default async function UserAvatar() {
  const session = await auth()
 
  if (!session?.user) return null
 
  return (
    <div>
      <img src={session.user.image ?? ""} alt="User Avatar" width={48} height={48} className="rounded-full" />
    </div>
  )
}