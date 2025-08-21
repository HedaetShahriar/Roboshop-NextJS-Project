export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (res.ok) {
      router.push("/products");
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Login to Roboshop</h2>
      <button onClick={() => signIn("google", { callbackUrl: "/products" })} className="w-full mb-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
        Sign in with Google
      </button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" placeholder="Username" className="w-full border rounded px-3 py-2" />
        <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Sign in</button>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
