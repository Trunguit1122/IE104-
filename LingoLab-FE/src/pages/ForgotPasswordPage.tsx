import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/auth";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success("Đã gửi email đặt lại mật khẩu!");
    } catch (error) {
      // Always show success message for security (prevent email enumeration)
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

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

              {!isSubmitted ? (
                <>
                  {/* Header */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
                    <p className="text-muted-foreground text-balance">
                      Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật
                      khẩu
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                  >
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
                        <p className="text-xs text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                    </Button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="flex flex-col items-center gap-4 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h1 className="text-2xl font-bold text-green-600">
                    Đã gửi email!
                  </h1>
                  <p className="text-muted-foreground">
                    Nếu tài khoản với email{" "}
                    <span className="font-medium text-foreground">
                      {getValues("email")}
                    </span>{" "}
                    tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài
                    phút.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Không nhận được email? Kiểm tra thư mục spam hoặc thử lại.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Gửi lại
                  </Button>
                </div>
              )}

              {/* Back to login */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate(ROUTES.SIGNIN)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

