import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/auth";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { Lock, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
      .max(32, { message: "Mật khẩu không được quá 32 ký tự" })
      .regex(/[A-Z]/, { message: "Mật khẩu phải có ít nhất 1 chữ hoa" })
      .regex(/[a-z]/, { message: "Mật khẩu phải có ít nhất 1 chữ thường" })
      .regex(/[0-9]/, { message: "Mật khẩu phải có ít nhất 1 số" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token không hợp lệ hoặc đã hết hạn.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setStatus("success");
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check if token exists
  if (!token && status === "form") {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
        <div className="w-full max-w-sm md:max-w-md">
          <Card className="overflow-hidden border-border">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center gap-6 text-center">
                <a href="/" className="mx-auto block w-fit">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <XCircle className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold text-destructive">
                  Link không hợp lệ
                </h1>
                <p className="text-muted-foreground">
                  Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                </p>
                <Button
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  className="w-full"
                >
                  Yêu cầu link mới
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
      <div className="w-full max-w-sm md:max-w-md">
        <Card className="overflow-hidden border-border">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="mx-auto block w-fit">
                  <img src="/logo.svg" alt="logo" />
                </a>
              </div>

              {status === "form" && (
                <>
                  {/* Header */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
                    <p className="text-muted-foreground text-balance">
                      Nhập mật khẩu mới cho tài khoản của bạn
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="password" className="block text-sm">
                        Mật khẩu mới
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        {...register("password")}
                      />
                      {errors.password && (
                        <p className="text-xs text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <Label htmlFor="confirmPassword" className="block text-sm">
                        Xác nhận mật khẩu
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        {...register("confirmPassword")}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>8-32 ký tự</li>
                        <li>Ít nhất 1 chữ hoa và 1 chữ thường</li>
                        <li>Ít nhất 1 số</li>
                        <li>Ít nhất 1 ký tự đặc biệt</li>
                      </ul>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                    </Button>
                  </form>
                </>
              )}

              {status === "success" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h1 className="text-2xl font-bold text-green-600">
                    Đặt lại mật khẩu thành công!
                  </h1>
                  <p className="text-muted-foreground">
                    Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng
                    mật khẩu mới.
                  </p>
                  <Button
                    onClick={() => navigate(ROUTES.SIGNIN)}
                    className="w-full mt-2"
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <XCircle className="h-16 w-16 text-destructive" />
                  <h1 className="text-2xl font-bold text-destructive">
                    Đặt lại mật khẩu thất bại
                  </h1>
                  <p className="text-muted-foreground">{errorMessage}</p>
                  <div className="flex flex-col gap-3 w-full mt-2">
                    <Button
                      onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                      className="w-full"
                    >
                      Yêu cầu link mới
                    </Button>
                    <Button
                      onClick={() => navigate(ROUTES.SIGNIN)}
                      variant="outline"
                      className="w-full"
                    >
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

