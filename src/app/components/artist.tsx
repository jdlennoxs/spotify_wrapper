import { auth } from "@/server/auth"
import { getTopArtist } from "@/server/spotify"
 
export default async function Artist() {
  const session = await auth()
  if (!session?.user) return null
  const artists = await getTopArtist(session)
  // const artist = {
  //     name: "test",
    // images: [{ url: "test" }],
    // followers: { total: 100 }
// }
 
  return (
    <div className="flex flex-row gap-4">
      {artists?.map((artist) => (
        <div>
          <img src={artist?.images[0]?.url ?? undefined} alt="Artist" className="rounded-md shadow-lg h-32 w-32" />
          <p>{artist?.name}</p>
        </div>
      ))}
    </div>
  )
}