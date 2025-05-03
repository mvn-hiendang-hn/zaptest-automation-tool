import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { API_BASE_URL } from "@/config/api";

interface ProfileFormValues {
  fullName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

const profileSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").optional(),
});

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userMetadata, setUserMetadata] = useState<{
    fullName?: string;
    avatarUrl?: string;
  }>({});

  // Fetch user metadata when component mounts
  useEffect(() => {
    const fetchUserMetadata = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserMetadata({
            fullName: data.displayName || user.displayName,
            avatarUrl: data.avatarUrl
          });
        }
      } catch (error) {
        console.error('Error fetching user metadata:', error);
      }
    };
    
    fetchUserMetadata();
  }, [user]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: userMetadata.fullName || user?.displayName || "",
      email: user?.email || "",
    },
  });

  // Update form values when userMetadata changes
  useEffect(() => {
    if (userMetadata.fullName) {
      form.setValue('fullName', userMetadata.fullName);
    }
  }, [userMetadata, form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      try {
        setIsUploading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Chưa đăng nhập');
        }
        
        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append('avatar', acceptedFiles[0]);
        
        // Gửi file ảnh đến API
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Không thể cập nhật ảnh đại diện');
        }
        
        const data = await response.json();
        setUserMetadata(prev => ({
          ...prev,
          avatarUrl: data.user.avatarUrl
        }));
        
        toast({
          title: "Cập nhật thành công",
          description: "Ảnh đại diện của bạn đã được cập nhật",
        });
      } catch (error) {
        console.error('Error updating avatar:', error);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật ảnh đại diện",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      
      // Sử dụng hàm updateProfile từ AuthContext
      await updateProfile({
        displayName: data.fullName,
      });
      
      // Cập nhật local state
      setUserMetadata(prev => ({
        ...prev,
        fullName: data.fullName
      }));
      
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin profile của bạn đã được cập nhật",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userMetadata.avatarUrl} />
                <AvatarFallback>
                  {user?.displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                {...getRootProps()}
                className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                  isDragActive ? 'opacity-100' : ''
                }`}
              >
                <input {...getInputProps()} />
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {userMetadata.fullName || user?.displayName || "Chưa cập nhật"}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập họ và tên" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập mật khẩu hiện tại" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập mật khẩu mới" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 