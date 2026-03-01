// [CYCL:318067db-8780-4290-aff7-89d509f8edc9] Group creation page
import CreateGroupForm from '@/components/groups/CreateGroupForm'

export default function NewGroupPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Create a group</h1>
      <div className="bg-[#13112b] border border-[#2e2a5e] rounded-2xl p-6">
        <CreateGroupForm />
      </div>
    </div>
  )
}
