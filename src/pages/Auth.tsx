import React, { useState, useEffect, useRef } from "react";
// Auth page component
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Phone, Calendar, Globe, ArrowLeft, MapPin, Upload, FileText, Building, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/logo.png";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().trim().email({ message: "Email inválido (debe incluir @)" }),
  phone: z.string().trim().min(10, { message: "El teléfono debe tener al menos 10 dígitos" }),
  nationality: z.string().min(1, { message: "Selecciona tu nacionalidad" }),
  country: z.string().min(1, { message: "Selecciona un país" }),
  fullAddress: z.string().trim().min(10, { message: "La dirección debe tener al menos 10 caracteres" }),
  birthDate: z.string().min(1, { message: "Ingresa tu fecha de nacimiento" }),
  proofOfAddressType: z.string().min(1, { message: "Selecciona el tipo de documento" }),
  idDocumentType: z.string().min(1, { message: "Selecciona el tipo de identificación" }),
  accountType: z.string().min(1, { message: "Selecciona el tipo de cuenta" }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos" }),
}).refine((data) => data.password.trim() === data.confirmPassword.trim(), {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // OTP Verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Trusted-device state for direct login flow
  const [rememberDevice, setRememberDevice] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPasswordOtp, setShowForgotPasswordOtp] = useState(false);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [newPasswordForReset, setNewPasswordForReset] = useState("");
  const [confirmNewPasswordForReset, setConfirmNewPasswordForReset] = useState("");
  
  // Reset password state (when coming from email link)
  // Detect the recovery link synchronously so the SIGNED_IN event can never
  // redirect the user into the dashboard before setting the new password.
  const isRecoveryUrl = () => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    return hash.includes("type=recovery") || search.includes("type=recovery");
  };
  const [showResetPassword, setShowResetPassword] = useState(isRecoveryUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupNationality, setSignupNationality] = useState("");
  const [signupCountry, setSignupCountry] = useState("");
  const [signupFullAddress, setSignupFullAddress] = useState("");
  const [signupBirthDate, setSignupBirthDate] = useState("");
  const [signupProofOfAddressType, setSignupProofOfAddressType] = useState("");
  const [signupProofOfAddressFile, setSignupProofOfAddressFile] = useState<File | null>(null);
  const [signupProofOfAddressPreview, setSignupProofOfAddressPreview] = useState<string | null>(null);
  const [signupIdDocumentType, setSignupIdDocumentType] = useState("");
  const [signupIdDocumentNumber, setSignupIdDocumentNumber] = useState("");
  const [signupAccountType, setSignupAccountType] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Prevent onAuthStateChange auto-redirect during the login->OTP flow (avoids race with SIGNED_IN)
  const suppressAuthRedirectRef = useRef(false);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const recoveryModeRef = useRef(isRecoveryUrl());

  // Show an explanation when the recovery link is expired or already used
  useEffect(() => {
    const hashParams = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
    const linkError = hashParams.get("error_description") || searchParams.get("error_description");
    const errorCode = hashParams.get("error") || searchParams.get("error");
    if (linkError || errorCode) {
      toast({
        title: "Enlace no válido",
        description: "El enlace para restablecer la contraseña expiró o ya fue usado. Solicita uno nuevo.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
          recoveryModeRef.current = true;
          setShowResetPassword(true);
          return;
        }

        // Never redirect while the user still has to set a new password
        if (recoveryModeRef.current) {
          return;
        }

        if (suppressAuthRedirectRef.current) {
          console.log("Skipping redirect - login in progress");
          return;
        }

        if (event === 'SIGNED_IN' && session?.user && !showResetPassword) {
          // Check user role and redirect accordingly
          setTimeout(async () => {
            if (suppressAuthRedirectRef.current) {
              console.log("Skipping redirect after timeout - login in progress");
              return;
            }

            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .single();

            if (roleData?.role === "admin") {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, showResetPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // IMPORTANT: suppress auth listener redirects immediately to avoid SIGNED_IN race
    suppressAuthRedirectRef.current = true;
    
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      suppressAuthRedirectRef.current = false;
      return;
    }

    setIsLoading(true);
    
    try {
      // First check if user is admin before signing in
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        suppressAuthRedirectRef.current = false;
        toast({
          title: "Error al iniciar sesión",
          description: error.message === "Invalid login credentials"
            ? "Credenciales inválidas"
            : error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleData?.role === "admin") {
        suppressAuthRedirectRef.current = false;
        localStorage.setItem("qlb_session_start", Date.now().toString());
        navigate("/admin");
        setIsLoading(false);
        return;
      }

      // Per-user OTP exemption (set by an administrator)
      const { data: otpExemptProfile } = await supabase
        .from("profiles")
        .select("skip_login_otp")
        .eq("user_id", authData.user.id)
        .single();

      if (otpExemptProfile?.skip_login_otp) {
        suppressAuthRedirectRef.current = false;
        localStorage.setItem("qlb_session_start", Date.now().toString());
        navigate("/dashboard");
        setIsLoading(false);
        return;
      }

      // Trusted device: skip OTP if this device was remembered (non-admin users only)
      const storedDeviceToken = localStorage.getItem("qlb_device_token");
      if (storedDeviceToken) {
        try {
          const trustedResponse = await supabase.functions.invoke("check-trusted-device", {
            body: { email: loginEmail, deviceToken: storedDeviceToken },
          });

          if (trustedResponse.data?.trusted) {
            suppressAuthRedirectRef.current = false;
            localStorage.setItem("qlb_session_start", Date.now().toString());
            toast({
              title: "Dispositivo reconocido",
              description: "Bienvenido de vuelta a Quantum Ledger.",
            });
            navigate("/dashboard");
            setIsLoading(false);
            return;
          }

          // Token no longer valid (expired or revoked)
          localStorage.removeItem("qlb_device_token");
        } catch (trustedError) {
          console.error("Error checking trusted device:", trustedError);
        }
      }

      // OTP verification removed: users log in directly and continue to the dashboard.
      if (rememberDevice) {
        try {
          const registerResponse = await supabase.functions.invoke("register-trusted-device", {
            body: { email: loginEmail },
          });

          if (registerResponse.data?.deviceToken) {
            localStorage.setItem("qlb_device_token", registerResponse.data.deviceToken);
          }
        } catch (registerError) {
          console.error("Error registering trusted device:", registerError);
        }
      }

      suppressAuthRedirectRef.current = false;
      localStorage.setItem("qlb_session_start", Date.now().toString());
      toast({
        title: "Inicio de sesión correcto",
        description: rememberDevice
          ? "Bienvenido a Quantum Ledger. Este dispositivo ha sido recordado."
          : "Bienvenido a Quantum Ledger.",
      });
      navigate("/dashboard");
    } catch (unexpectedError: any) {
      console.error("Unexpected login error:", unexpectedError);
      suppressAuthRedirectRef.current = false;
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al iniciar sesión. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signupSchema.safeParse({ 
      fullName: signupFullName, 
      email: signupEmail,
      phone: signupPhone,
      nationality: signupNationality,
      country: signupCountry,
      fullAddress: signupFullAddress,
      birthDate: signupBirthDate,
      proofOfAddressType: signupProofOfAddressType,
      idDocumentType: signupIdDocumentType,
      accountType: signupAccountType,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      acceptTerms: acceptTerms
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Validate proof of address file
    if (!signupProofOfAddressFile) {
      setErrors({ proofOfAddressFile: "Debes subir un documento de comprobante de domicilio" });
      return;
    }

    // Validate ID document number
    if (!signupIdDocumentNumber || signupIdDocumentNumber.length < 5) {
      setErrors({ idDocumentNumber: "Ingresa un número de identificación válido" });
      return;
    }

    setIsLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: signupFullName,
          phone: signupPhone,
          nationality: signupNationality,
          country: signupCountry,
          full_address: signupFullAddress,
          birth_date: signupBirthDate,
          proof_of_address_type: signupProofOfAddressType,
          id_document_type: signupIdDocumentType,
          account_type: signupAccountType,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado. Intenta iniciar sesión.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
      return;
    }

    // Upload documents if user was created
    if (authData?.user) {
      // Upload proof of address
      if (signupProofOfAddressFile) {
        const fileExt = signupProofOfAddressFile.name.split('.').pop();
        const fileName = `${authData.user.id}/proof_of_address.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('identity-documents')
          .upload(fileName, signupProofOfAddressFile, { upsert: true });

        if (uploadError) {
          console.error("Error uploading proof of address:", uploadError);
        }
      }

      // Ensure the profile row exists and is marked as pending so admins can see the user immediately.
      await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          email: signupEmail,
          full_name: signupFullName,
          status: 'pending',
          verification_status: 'pending',
          proof_of_address_url: signupProofOfAddressFile ? `${authData.user.id}/proof_of_address.${signupProofOfAddressFile.name.split('.').pop()}` : null,
          proof_of_address_type: signupProofOfAddressType,
          id_document_number: signupIdDocumentNumber,
          nationality: signupNationality,
          country: signupCountry,
          full_address: signupFullAddress,
          phone: signupPhone,
          birth_date: signupBirthDate,
          account_type: signupAccountType,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (signInError) {
        throw signInError;
      }

      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email: signupEmail, fullName: signupFullName },
        });
      } catch (welcomeError) {
        console.error("Error sending welcome email:", welcomeError);
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta está lista y ya puedes acceder al dashboard.",
      });

      localStorage.setItem("qlb_session_start", Date.now().toString());
      navigate("/dashboard");
    } catch (loginError: any) {
      console.error("Error signing in after signup:", loginError);
      toast({
        title: "Cuenta creada",
        description: "La cuenta fue creada correctamente. Ahora puedes iniciar sesión con tus credenciales.",
      });
      setActiveTab("login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Por favor ingresa el código de 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("verify-otp", {
        body: { email: pendingEmail, code: otpCode },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (!data.success) {
        toast({
          title: "Error al verificar",
          description: data.error || "Código inválido o expirado.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email: pendingEmail, fullName: signupFullName },
        });
      } catch (welcomeError) {
        console.error("Error sending welcome email:", welcomeError);
      }

      toast({
        title: "¡Verificación exitosa!",
        description: "Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.",
      });
      
      // Redirect to login
      setShowOtpVerification(false);
      setOtpCode("");
      setPendingEmail("");
      setActiveTab("login");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error al verificar",
        description: "El código es inválido o ha expirado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { email: pendingEmail, fullName: "" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResendCooldown(60);
      toast({
        title: "Código reenviado",
        description: "Revisa tu correo electrónico.",
      });
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Error al reenviar",
        description: "No pudimos reenviar el código. Intenta de nuevo.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleBackToSignup = () => {
    setShowOtpVerification(false);
    setOtpCode("");
    setPendingEmail("");
  };

  // Forgot password handlers
  const handleSendForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail || !z.string().email().safeParse(forgotPasswordEmail).success) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: { email: forgotPasswordEmail, type: "password_reset" },
      });

      if (error) throw error;

      toast({
        title: "Código enviado",
        description: "Si el correo está registrado, recibirás un código para restablecer tu contraseña.",
      });
      setShowForgotPasswordOtp(true);
      setResendCooldown(60);
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: error.message || "No pudimos procesar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotPasswordOtp.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Por favor ingresa el código de 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (newPasswordForReset.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPasswordForReset !== confirmNewPasswordForReset) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean iguales.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("reset-password-with-otp", {
        body: { 
          email: forgotPasswordEmail, 
          code: forgotPasswordOtp,
          newPassword: newPasswordForReset 
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo cambiar la contraseña.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.",
      });
      
      // Reset all forgot password states
      setShowForgotPassword(false);
      setShowForgotPasswordOtp(false);
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setNewPasswordForReset("");
      setConfirmNewPasswordForReset("");
      setActiveTab("login");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "El código es inválido o ha expirado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleResendForgotPasswordOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { email: forgotPasswordEmail, type: "password_reset" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResendCooldown(60);
      toast({
        title: "Código reenviado",
        description: "Revisa tu correo electrónico.",
      });
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Error al reenviar",
        description: "No pudimos reenviar el código. Intenta de nuevo.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowForgotPasswordOtp(false);
    setForgotPasswordEmail("");
    setForgotPasswordOtp("");
    setNewPasswordForReset("");
    setConfirmNewPasswordForReset("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean iguales.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // The recovery link must have created a session; without it we cannot save
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Enlace no válido",
        description: "El enlace expiró o ya fue usado. Solicita uno nuevo desde \"¿Olvidaste tu contraseña?\".",
        variant: "destructive",
      });
      recoveryModeRef.current = false;
      setShowResetPassword(false);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      const message = /weak|pwned|known to be weak/i.test(error.message)
        ? "Esa contraseña es demasiado común y fue filtrada en otros sitios. Elige una diferente."
        : /same.*password/i.test(error.message)
        ? "La nueva contraseña debe ser distinta a la anterior."
        : error.message;
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Inicia sesión con la nueva contraseña.",
      });
      recoveryModeRef.current = false;
      setShowResetPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      await supabase.auth.signOut();
      window.history.replaceState({}, "", "/auth");
      navigate("/auth?tab=login");
    }
    setIsLoading(false);
  };

  // Reset Password Screen (from email link)
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <Card className="w-full max-w-md relative z-10 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <img src={logo} alt="Quantum Ledger Business" className="mx-auto h-20 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-white">Nueva contraseña</CardTitle>
            <CardDescription className="text-slate-400">
              Ingresa tu nueva contraseña para completar el restablecimiento.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-slate-300">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot Password Screen - Enter Email
  if (showForgotPassword && !showForgotPasswordOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <Card className="w-full max-w-md relative z-10 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <img src={logo} alt="Quantum Ledger Business" className="mx-auto h-20 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-white">Recuperar contraseña</CardTitle>
            <CardDescription className="text-slate-400">
              Ingresa tu email y te enviaremos un enlace seguro para crear una nueva contraseña.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-slate-400 hover:text-slate-300 text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot Password Screen - Enter OTP and New Password
  if (showForgotPassword && showForgotPasswordOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <Card className="w-full max-w-md relative z-10 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <img src={logo} alt="Quantum Ledger Business" className="mx-auto h-20 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-white">Nueva contraseña</CardTitle>
            <CardDescription className="text-slate-400">
              Ingresa el código que enviamos a<br />
              <span className="text-blue-400 font-medium">{forgotPasswordEmail}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleResetPasswordWithOtp} className="space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-slate-300">Código de verificación</Label>
                <InputOTP
                  maxLength={6}
                  value={forgotPasswordOtp}
                  onChange={(value) => setForgotPasswordOtp(value)}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password-reset" className="text-slate-300">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password-reset"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPasswordForReset}
                    onChange={(e) => setNewPasswordForReset(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password-reset" className="text-slate-300">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password-reset"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPasswordForReset}
                    onChange={(e) => setConfirmNewPasswordForReset(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendForgotPasswordOtp}
                disabled={resendCooldown > 0 || isLoading}
                className="text-blue-400 hover:text-blue-300 text-sm disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? `Reenviar código en ${resendCooldown}s`
                  : "¿No recibiste el código? Reenviar"
                }
              </button>
              
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-slate-400 hover:text-slate-300 text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification Screen
  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <Card className="w-full max-w-md relative z-10 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <img src={logo} alt="Quantum Ledger Business" className="mx-auto h-20 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-white">Verifica tu correo</CardTitle>
            <CardDescription className="text-slate-400">
              Hemos enviado un código de 6 dígitos a<br />
              <span className="text-blue-400 font-medium">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-xl bg-slate-700/50 border-slate-600 text-white" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={handleVerifyOtp}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar código"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-slate-400 text-sm">
                ¿No recibiste el código?
              </p>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading}
                className="text-blue-400 hover:text-blue-300 hover:bg-transparent"
              >
                {resendCooldown > 0 
                  ? `Reenviar en ${resendCooldown}s` 
                  : "Reenviar código"}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleBackToSignup}
              className="w-full text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al registro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md relative z-10 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <img src={logo} alt="Quantum Ledger Business" className="mx-auto h-20 w-auto mb-2" />
          <CardTitle className="text-2xl font-bold text-white">Quantum Ledger</CardTitle>
          <CardDescription className="text-slate-400">
            Plataforma de banca digital
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600">
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-300">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Nombre completo y Fecha de nacimiento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      Nombre completo
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    {errors.fullName && <p className="text-xs text-red-400">{errors.fullName}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-birthdate" className="text-slate-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Fecha de nacimiento
                    </Label>
                    <Input
                      id="signup-birthdate"
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={signupBirthDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
                        if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5);
                        if (value.length > 10) value = value.slice(0, 10);
                        setSignupBirthDate(value);
                      }}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                      maxLength={10}
                    />
                    {errors.birthDate && <p className="text-xs text-red-400">{errors.birthDate}</p>}
                  </div>
                </div>

                {/* Nacionalidad y País de residencia */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-400" />
                      Nacionalidad
                    </Label>
                    <Select value={signupNationality} onValueChange={setSignupNationality}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 text-white [&_[role=option]]:text-white [&_[role=option]:focus]:bg-slate-700 [&_[role=option]:focus]:text-white max-h-60">
                        <SelectItem value="US">Estadounidense</SelectItem>
                        <SelectItem value="CA">Canadiense</SelectItem>
                        <SelectItem value="MX">Mexicana</SelectItem>
                        <SelectItem value="GT">Guatemalteca</SelectItem>
                        <SelectItem value="SV">Salvadoreña</SelectItem>
                        <SelectItem value="HN">Hondureña</SelectItem>
                        <SelectItem value="NI">Nicaragüense</SelectItem>
                        <SelectItem value="CR">Costarricense</SelectItem>
                        <SelectItem value="PA">Panameña</SelectItem>
                        <SelectItem value="CU">Cubana</SelectItem>
                        <SelectItem value="DO">Dominicana</SelectItem>
                        <SelectItem value="CO">Colombiana</SelectItem>
                        <SelectItem value="VE">Venezolana</SelectItem>
                        <SelectItem value="EC">Ecuatoriana</SelectItem>
                        <SelectItem value="PE">Peruana</SelectItem>
                        <SelectItem value="BR">Brasileña</SelectItem>
                        <SelectItem value="BO">Boliviana</SelectItem>
                        <SelectItem value="PY">Paraguaya</SelectItem>
                        <SelectItem value="UY">Uruguaya</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="CL">Chilena</SelectItem>
                        <SelectItem value="ES">Española</SelectItem>
                        <SelectItem value="PT">Portuguesa</SelectItem>
                        <SelectItem value="FR">Francesa</SelectItem>
                        <SelectItem value="IT">Italiana</SelectItem>
                        <SelectItem value="DE">Alemana</SelectItem>
                        <SelectItem value="GB">Británica</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.nationality && <p className="text-xs text-red-400">{errors.nationality}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      País de residencia
                    </Label>
                    <Select value={signupCountry} onValueChange={setSignupCountry}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 text-white [&_[role=option]]:text-white [&_[role=option]:focus]:bg-slate-700 [&_[role=option]:focus]:text-white max-h-60">
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="CA">Canadá</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="GT">Guatemala</SelectItem>
                        <SelectItem value="SV">El Salvador</SelectItem>
                        <SelectItem value="HN">Honduras</SelectItem>
                        <SelectItem value="NI">Nicaragua</SelectItem>
                        <SelectItem value="CR">Costa Rica</SelectItem>
                        <SelectItem value="PA">Panamá</SelectItem>
                        <SelectItem value="CU">Cuba</SelectItem>
                        <SelectItem value="DO">República Dominicana</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="VE">Venezuela</SelectItem>
                        <SelectItem value="EC">Ecuador</SelectItem>
                        <SelectItem value="PE">Perú</SelectItem>
                        <SelectItem value="BR">Brasil</SelectItem>
                        <SelectItem value="BO">Bolivia</SelectItem>
                        <SelectItem value="PY">Paraguay</SelectItem>
                        <SelectItem value="UY">Uruguay</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="ES">España</SelectItem>
                        <SelectItem value="PT">Portugal</SelectItem>
                        <SelectItem value="FR">Francia</SelectItem>
                        <SelectItem value="IT">Italia</SelectItem>
                        <SelectItem value="DE">Alemania</SelectItem>
                        <SelectItem value="GB">Reino Unido</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-xs text-red-400">{errors.country}</p>}
                  </div>
                </div>

                {/* Dirección completa */}
                <div className="space-y-2">
                  <Label htmlFor="signup-address" className="text-slate-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Dirección completa
                  </Label>
                  <Textarea
                    id="signup-address"
                    placeholder="Calle, número, ciudad, código postal, estado/provincia"
                    value={signupFullAddress}
                    onChange={(e) => setSignupFullAddress(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px] resize-none"
                  />
                  {errors.fullAddress && <p className="text-xs text-red-400">{errors.fullAddress}</p>}
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      Número de teléfono
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                  </div>

                </div>

                {/* Correo electrónico */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Correo electrónico
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Tipo de cuenta */}
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    Tipo de cuenta
                  </Label>
                  <Select value={signupAccountType} onValueChange={setSignupAccountType}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Seleccionar tipo de cuenta" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white [&_[role=option]]:text-white [&_[role=option]:focus]:bg-slate-700 [&_[role=option]:focus]:text-white">
                      <SelectItem value="savings">Cuenta de Ahorros</SelectItem>
                      <SelectItem value="checking">Cuenta de Cheques</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.accountType && <p className="text-xs text-red-400">{errors.accountType}</p>}
                </div>

                {/* Documentos en grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Identificación - solo número */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      Tipo de identificación
                    </Label>
                    <Select value={signupIdDocumentType} onValueChange={setSignupIdDocumentType}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 text-white [&_[role=option]]:text-white [&_[role=option]:focus]:bg-slate-700 [&_[role=option]:focus]:text-white">
                        <SelectItem value="passport">Pasaporte</SelectItem>
                        <SelectItem value="national_id">Cédula de identidad</SelectItem>
                        <SelectItem value="drivers_license">Licencia de conducir</SelectItem>
                        <SelectItem value="foreign_id">Carnet de extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.idDocumentType && <p className="text-xs text-red-400">{errors.idDocumentType}</p>}
                    
                    <Input
                      type="text"
                      placeholder="Número de documento"
                      value={signupIdDocumentNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setSignupIdDocumentNumber(value);
                      }}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                      maxLength={20}
                    />
                    {errors.idDocumentNumber && <p className="text-xs text-red-400">{errors.idDocumentNumber}</p>}
                  </div>

                  {/* Upload comprobante de domicilio */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Comprobante domicilio
                    </Label>
                    <Select value={signupProofOfAddressType} onValueChange={setSignupProofOfAddressType}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 text-white [&_[role=option]]:text-white [&_[role=option]:focus]:bg-slate-700 [&_[role=option]:focus]:text-white">
                        <SelectItem value="water">Recibo de agua</SelectItem>
                        <SelectItem value="electricity">Recibo de luz</SelectItem>
                        <SelectItem value="gas">Recibo de gas</SelectItem>
                        <SelectItem value="internet">Recibo de internet</SelectItem>
                        <SelectItem value="rental_contract">Contrato arrendamiento</SelectItem>
                        <SelectItem value="residence_letter">Carta de residencia</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.proofOfAddressType && <p className="text-xs text-red-400">{errors.proofOfAddressType}</p>}
                    
                    <div 
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                        signupProofOfAddressPreview 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      }`}
                      onClick={() => document.getElementById('proof-of-address-input')?.click()}
                    >
                      <input
                        id="proof-of-address-input"
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast({
                                title: "Archivo muy grande",
                                description: "El archivo no debe superar los 10MB",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSignupProofOfAddressFile(file);
                            if (file.type.startsWith('image/')) {
                              setSignupProofOfAddressPreview(URL.createObjectURL(file));
                            } else {
                              setSignupProofOfAddressPreview('file');
                            }
                          }
                        }}
                      />
                      {signupProofOfAddressPreview ? (
                        <div className="flex flex-col items-center gap-1">
                          {signupProofOfAddressPreview === 'file' ? (
                            <FileText className="h-8 w-8 text-blue-400" />
                          ) : (
                            <img 
                              src={signupProofOfAddressPreview} 
                              alt="Preview" 
                              className="h-12 w-auto rounded object-cover"
                            />
                          )}
                          <span className="text-xs text-blue-400 truncate max-w-full">{signupProofOfAddressFile?.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <span className="text-xs text-slate-400">Subir fotografía</span>
                        </div>
                      )}
                    </div>
                    {errors.proofOfAddressFile && <p className="text-xs text-red-400">{errors.proofOfAddressFile}</p>}
                  </div>
                </div>

                {/* Contraseñas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-1 border-slate-500 data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                    Acepto los <span className="text-blue-400 hover:underline">Términos y Condiciones</span> y la <span className="text-blue-400 hover:underline">Política de Privacidad</span>
                  </Label>
                </div>
                {errors.acceptTerms && <p className="text-xs text-red-400">{errors.acceptTerms}</p>}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

