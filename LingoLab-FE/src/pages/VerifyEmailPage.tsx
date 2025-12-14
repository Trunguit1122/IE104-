import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api/auth";
import { ROUTES } from "@/constants";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type VerifyStatus = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token xác thực không hợp lệ hoặc đã hết hạn.");
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setStatus("success");
        setMessage("Email của bạn đã được xác thực thành công!");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Xác thực thất bại. Token có thể đã hết hạn."
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
      <div className="w-full max-w-sm md:max-w-md">
        <Card className="overflow-hidden border-border">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Logo */}
              <a href="/" className="mx-auto block w-fit">
                <img src="/logo.svg" alt="logo" />
              </a>

              {/* Status Icon */}
              {status === "loading" && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <h1 className="text-2xl font-bold">Đang xác thực...</h1>
                  <p className="text-muted-foreground">
                    Vui lòng đợi trong giây lát
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <h1 className="text-2xl font-bold text-green-600">
                    Xác thực thành công!
                  </h1>
                  <p className="text-muted-foreground">{message}</p>
                  <Button
                    onClick={() => navigate(ROUTES.SIGNIN)}
                    className="w-full mt-4"
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-4">
                  <XCircle className="h-16 w-16 text-destructive" />
                  <h1 className="text-2xl font-bold text-destructive">
                    Xác thực thất bại
                  </h1>
                  <p className="text-muted-foreground">{message}</p>
                  <div className="flex flex-col gap-3 w-full mt-4">
                    <Button
                      onClick={() => navigate(ROUTES.SIGNIN)}
                      variant="outline"
                      className="w-full"
                    >
                      Quay lại đăng nhập
                    </Button>
                    <Button
                      onClick={() => navigate(ROUTES.SIGNUP)}
                      className="w-full"
                    >
                      Đăng ký lại
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-balance px-6 text-center text-muted-foreground mt-6">
          Nếu bạn gặp vấn đề, vui lòng liên hệ{" "}
          <a href="#" className="text-primary underline underline-offset-4">
            hỗ trợ
          </a>
          .
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

