import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";

const signInSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      // Get user role from store after login
      const user = useAuthStore.getState().user;

      toast.success("Đăng nhập thành công!");

      // Navigate based on role
      // Backend uses 'learner' instead of 'student'
      if (user?.role === "teacher") {
        navigate(ROUTES.TEACHER.DASHBOARD);
      } else if (user?.role === "learner") {
        navigate(ROUTES.STUDENT.DASHBOARD);
      } else if (user?.role === "admin") {
        navigate(ROUTES.TEACHER.DASHBOARD); // Admin goes to teacher dashboard
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Đăng nhập thất bại"
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Header*/}
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold">Đăng nhập</h1>
                <p className="text-muted-foreground text-balance">
                  Đăng nhập để tiếp tục sử dụng dịch vụ
                </p>
              </div>
              {/* Email*/}
              <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                />

                {errors.email && (
                  <p className="text-xs text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {/* Password*/}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="block text-sm">
                    Mật khẩu
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mật khẩu"
                  {...register("password")}
                />

                {errors.password && (
                  <p className="text-xs text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Chưa có tài khoản?{" "}
                  <a href="/signup" className="text-primary underline">
                    Đăng ký
                  </a>
                </p>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover "
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *[a]:underline *[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với các{" "}
        <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
        .
      </div>
    </div>
  );
}
