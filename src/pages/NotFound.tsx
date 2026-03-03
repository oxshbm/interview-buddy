import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The requested route does not exist in this MVP.</p>
      <Button onClick={() => navigate("/")}>Go Home</Button>
    </main>
  );
}
