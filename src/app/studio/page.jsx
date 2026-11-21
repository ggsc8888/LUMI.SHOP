import{redirect}from"next/navigation";import{currentUser}from"@/auth";import{Header}from"@/components/Header";import{Studio}from"@/components/Studio";export const metadata={title:"Studio \xB7 Jewel Lister"};export default async function StudioPage(){const user=await currentUser();return user||redirect("/"),<>
      <Header user={user}active="studio"/>
      <Studio/>
    </>}
