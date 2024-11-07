
import { auth, signIn } from "@/server/auth"
 
export default async function SignIn() {
    const session = await auth()
 
    if (session?.user) return null
  return (
    <form
      action={async () => {
        "use server"
        await signIn("spotify")
      }}
    >
      <button type="submit">Signin with Spotify</button>
    </form>
  )
} 