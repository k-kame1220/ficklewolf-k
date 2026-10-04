import { UpdateRequired } from "@/features/startup";

const UpdatePage = () => {
  return (
    <UpdateRequired
      onUpdate={() => {
        window.location.reload();
      }}
    />
  );
};

export default UpdatePage;
