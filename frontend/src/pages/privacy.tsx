import Head from 'next/head';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/translations';

interface PrivacySection {
  key: string;
  title: string;
  description?: string;
  items?: string[];
}

interface PrivacyContent {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PrivacySection[];
  contact: {
    title: string;
    description: string;
    emailLabel: string;
    email: string;
  };
}

const privacyContent: Record<Language, PrivacyContent> = {
  'en-US': {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: November 8, 2025',
    intro: [
      'We built WebApp Manager to help teams manage software releases, API access, and audit trails with confidence. Protecting the data you entrust to us is a responsibility we take seriously.',
      'This Privacy Policy explains the types of information we collect, how we use and share it, and the choices you have. By using WebApp Manager you agree to the practices outlined below.',
    ],
    sections: [
      {
        key: 'information-we-collect',
        title: 'Information We Collect',
        items: [
          'Account information you provide such as name, email address, user role, avatar, and phone number.',
          'Authentication and security data including hashed passwords, session cookies, and access tokens generated within the platform.',
          'Product usage data like pages visited, actions taken, IP addresses, user-agent strings, and audit trail details recorded for security and compliance.',
          'Configuration data stored in company settings (for example, company profile, contact information, or social links) that you choose to manage in the dashboard.',
        ],
      },
      {
        key: 'how-we-use-information',
        title: 'How We Use Information',
        items: [
          'Deliver, operate, and maintain core WebApp Manager features such as authentication, role-based access, release tracking, and token issuance.',
          'Provide security, fraud-prevention, and auditing capabilities, including logging administrative actions and access token lifecycle events.',
          'Communicate with you about account activity, product changes, incidents, and support requests.',
          'Improve reliability and performance by analyzing aggregated usage metrics and error reports.',
        ],
      },
      {
        key: 'sharing-and-disclosure',
        title: 'Sharing & Disclosure',
        description: 'We do not sell your personal information. We only share it in limited circumstances:',
        items: [
          'Service providers that help us run the application (for example, cloud hosting, email services, or database backups) under contractual confidentiality obligations.',
          'Compliance with legal obligations or valid governmental requests when we are legally required to do so.',
          'Business continuity events such as a merger, acquisition, or asset sale, where we will provide notice and ensure appropriate safeguards.',
        ],
      },
      {
        key: 'data-retention',
        title: 'Data Retention',
        items: [
          'Account data remains active as long as your organization maintains an account with WebApp Manager.',
          'Audit logs and token history are retained to meet operational, security, and regulatory requirements. You may request tailored retention periods for your deployment.',
          'If you close your account, we will delete or anonymize associated personal data within a commercially reasonable timeframe, unless retention is required by law.',
        ],
      },
      {
        key: 'your-choices',
        title: 'Your Choices & Rights',
        items: [
          'You can update company profile details, contact information, and social links from the Settings area.',
          'Administrators can manage user accounts, roles, and custom permissions directly within the dashboard.',
          'You may request data exports or deletion by contacting us. We will respond in accordance with applicable privacy regulations.',
        ],
      },
      {
        key: 'data-security',
        title: 'Security Measures',
        items: [
          'Passwords are hashed using bcrypt and never stored in plain text.',
          'Role-based access controls and granular permissions restrict sensitive operations.',
          'Audit logging, token state tracking, and optional blockchain hashes provide tamper visibility for critical events.',
          'Infrastructure providers apply encryption at rest and in transit along with industry-standard safeguards.',
        ],
      },
    ],
    contact: {
      title: 'Questions or requests?',
      description: 'If you have any questions about this Privacy Policy or need assistance exercising your rights, we are here to help.',
      emailLabel: 'Contact our privacy team:',
      email: 'info@vuleits.com',
    },
  },
  vi: {
    title: 'Chính sách Bảo mật',
    lastUpdated: 'Cập nhật lần cuối: 8 tháng 11, 2025',
    intro: [
      'WebApp Manager được xây dựng để giúp các nhóm quản lý phiên bản phần mềm, quyền truy cập API và nhật ký kiểm tra một cách an toàn. Việc bảo vệ dữ liệu bạn tin tưởng cung cấp cho chúng tôi là trách nhiệm mà chúng tôi luôn coi trọng.',
      'Chính sách Bảo mật này mô tả các loại thông tin chúng tôi thu thập, cách chúng tôi sử dụng và chia sẻ thông tin cũng như các lựa chọn mà bạn có. Khi sử dụng WebApp Manager, bạn đồng ý với những nội dung được trình bày dưới đây.',
    ],
    sections: [
      {
        key: 'information-we-collect',
        title: 'Thông tin chúng tôi thu thập',
        items: [
          'Thông tin tài khoản do bạn cung cấp như họ tên, địa chỉ email, vai trò người dùng, ảnh đại diện và số điện thoại.',
          'Dữ liệu xác thực và bảo mật bao gồm mật khẩu đã được băm, cookie phiên đăng nhập và các token truy cập được tạo trong nền tảng.',
          'Dữ liệu sử dụng sản phẩm như trang đã truy cập, thao tác thực hiện, địa chỉ IP, chuỗi user-agent và chi tiết nhật ký kiểm tra được ghi nhận cho mục đích bảo mật và tuân thủ.',
          'Dữ liệu cấu hình được lưu trong phần Cài đặt công ty (ví dụ: thông tin doanh nghiệp, thông tin liên hệ hoặc liên kết mạng xã hội) mà bạn quản lý trong bảng điều khiển.',
        ],
      },
      {
        key: 'how-we-use-information',
        title: 'Cách chúng tôi sử dụng thông tin',
        items: [
          'Cung cấp, vận hành và duy trì các tính năng cốt lõi của WebApp Manager như xác thực, phân quyền, quản lý phiên bản phát hành và phát hành token.',
          'Đảm bảo an toàn, chống gian lận và phục vụ kiểm tra, bao gồm ghi nhật ký các hành động quản trị và vòng đời của token truy cập.',
          'Trao đổi với bạn về hoạt động tài khoản, thay đổi sản phẩm, sự cố và yêu cầu hỗ trợ.',
          'Cải thiện độ tin cậy và hiệu năng thông qua việc phân tích số liệu sử dụng tổng hợp và báo cáo lỗi.',
        ],
      },
      {
        key: 'sharing-and-disclosure',
        title: 'Chia sẻ & tiết lộ',
        description: 'Chúng tôi không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ trong một số trường hợp hạn chế sau:',
        items: [
          'Các nhà cung cấp dịch vụ hỗ trợ vận hành ứng dụng (ví dụ: dịch vụ đám mây, email hoặc sao lưu cơ sở dữ liệu) theo các thỏa thuận bảo mật nghiêm ngặt.',
          'Khi cần tuân thủ nghĩa vụ pháp lý hoặc yêu cầu hợp lệ từ cơ quan có thẩm quyền.',
          'Các tình huống đảm bảo hoạt động liên tục của doanh nghiệp như sáp nhập, mua lại hoặc chuyển nhượng tài sản. Chúng tôi sẽ thông báo và đảm bảo các biện pháp bảo vệ phù hợp.',
        ],
      },
      {
        key: 'data-retention',
        title: 'Thời gian lưu trữ dữ liệu',
        items: [
          'Dữ liệu tài khoản được duy trì miễn là tổ chức của bạn tiếp tục sử dụng WebApp Manager.',
          'Nhật ký kiểm tra và lịch sử token được lưu giữ để đáp ứng yêu cầu vận hành, bảo mật và tuân thủ. Bạn có thể yêu cầu chính sách lưu trữ phù hợp với triển khai của mình.',
          'Nếu bạn chấm dứt tài khoản, chúng tôi sẽ xóa hoặc ẩn danh dữ liệu cá nhân liên quan trong khoảng thời gian hợp lý, trừ khi pháp luật yêu cầu giữ lại.',
        ],
      },
      {
        key: 'your-choices',
        title: 'Lựa chọn & quyền của bạn',
        items: [
          'Bạn có thể cập nhật thông tin hồ sơ doanh nghiệp, thông tin liên hệ và liên kết mạng xã hội tại mục Cài đặt.',
          'Quản trị viên có thể quản lý tài khoản người dùng, vai trò và quyền tùy chỉnh trực tiếp trong bảng điều khiển.',
          'Bạn có thể yêu cầu xuất dữ liệu hoặc xóa dữ liệu bằng cách liên hệ với chúng tôi. Chúng tôi sẽ phản hồi theo các quy định bảo mật hiện hành.',
        ],
      },
      {
        key: 'data-security',
        title: 'Biện pháp bảo mật',
        items: [
          'Mật khẩu được băm bằng bcrypt và không bao giờ lưu ở dạng rõ.',
          'Cơ chế phân quyền dựa trên vai trò và quyền chi tiết giúp kiểm soát các thao tác nhạy cảm.',
          'Nhật ký kiểm tra, theo dõi trạng thái token và tùy chọn ghi nhận mã băm blockchain giúp phát hiện can thiệp trái phép.',
          'Hạ tầng được cung cấp với mã hóa dữ liệu khi lưu trữ và khi truyền tải cùng các biện pháp bảo vệ theo tiêu chuẩn ngành.',
        ],
      },
    ],
    contact: {
      title: 'Câu hỏi hoặc yêu cầu?',
      description: 'Nếu bạn có bất kỳ thắc mắc nào về Chính sách Bảo mật này hoặc cần hỗ trợ thực hiện quyền của mình, chúng tôi luôn sẵn sàng hỗ trợ.',
      emailLabel: 'Liên hệ bộ phận bảo mật của chúng tôi:',
      email: 'info@vuleits.com',
    },
  },
};

export default function PrivacyPage() {
  const { language } = useLanguage();
  const content = privacyContent[language] ?? privacyContent['en-US'];

  return (
    <Layout>
      <Head>
        <title>{content.title} · WebApp Manager</title>
        <meta
          name="description"
          content="Understand how WebApp Manager collects, uses, and protects your information."
        />
      </Head>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
          <p className="text-sm text-gray-500 mt-2">{content.lastUpdated}</p>
        </div>

        <div className="px-6 py-8 space-y-8">
          <div className="space-y-4 text-gray-600 leading-relaxed">
            {content.intro.map((paragraph, index) => (
              <p key={`intro-${index}`}>{paragraph}</p>
            ))}
          </div>

          {content.sections.map((section) => (
            <section key={section.key} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              {section.description && <p className="text-gray-600 leading-relaxed">{section.description}</p>}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2 text-gray-600 leading-relaxed">
                  {section.items.map((item, index) => (
                    <li key={`${section.key}-item-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">{content.contact.title}</h2>
            <p className="text-gray-600 leading-relaxed mt-2">{content.contact.description}</p>
            <p className="text-gray-600 leading-relaxed mt-4">
              <span className="font-medium text-gray-900">{content.contact.emailLabel}</span>{' '}
              <a
                href={`mailto:${content.contact.email}`}
                className="text-emerald-600 hover:text-emerald-500 font-medium"
              >
                {content.contact.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

