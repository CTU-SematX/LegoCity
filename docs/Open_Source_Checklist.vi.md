# The Open Source Checklist

## Giới thiệu

Dễ dàng bỏ sót các nhiệm vụ quan trọng khi release và maintain một dự án open source. Checklist này giúp đảm bảo dự án của bạn tuân theo best practices về sức khỏe, phát triển và bảo mật.

Sử dụng checklist này như một điểm khởi đầu thảo luận cho team và nền tảng cho cải thiện liên tục.

## Archiving và Deprecating Project

- Nên sử dụng chức năng "Archival" của platform. Theo cách này, nó trở thành read-only, bao gồm issues board, và được đánh dấu là inactive.
- Nên ghi trong README rằng dự án không còn được maintain.
- Nên được archived nếu không có maintainers.

## Documentation

- Phải đảm bảo dự án bao gồm các Community Health Files chuẩn (CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT, v.v.).  
  Xem [README.md Template Files section để biết danh sách đầy đủ](https://github.com/CTU-SematX/LegoCity#readme).

- Nên bao gồm usage documentation và architecture descriptions liên quan đến dự án.

## Legal và Licensing

- Phải đảm bảo license của dự án không xung đột với third-party licenses.
- License declarations phải tuân theo [REUSE licensing specification](https://reuse.software/), đảm bảo tất cả materials có thông tin copyright rõ ràng.

### Naming và Trademarks Check

- Nên đảm bảo tên dự án không xung đột với dự án hiện có hoặc vi phạm trademarks.
  - Thực hiện kiểm tra search engine chung cho tên dự án được đề xuất.
  - Thực hiện [Trademark Search](https://www.prv.se/en/ip-professional/trademarks/trademark-databases/).

> **Lưu ý**: Có thể hoàn toàn chấp nhận được khi sử dụng tên gợi nhớ đến trademark hiện có - nếu trademark hiện có được sử dụng cho các dịch vụ/lĩnh vực khác và không được công nhận là well-known trademark.

## People & Maintenance

- Phải đảm bảo maintainers có giáo dục hoặc kinh nghiệm với open source. Ví dụ, đọc guides tại <https://opensource.guide>.
- Phải đảm bảo maintainers có kế hoạch xử lý merge/pull requests (code reviews, v.v.).
- Phải đảm bảo maintainers có kế hoạch community engagement (responding to issues, reviewing pull requests).
- Phải đảm bảo ai đó chịu trách nhiệm về security issues.
- Phải bao gồm một section `Maintainer` trong mọi project README (team, individual, hoặc role).

- Nên thiết lập một release plan với chiến lược announcement và promotion rõ ràng.
- Nên sử dụng file CODEOWNERS cho mô tả maintenance chi tiết (bổ sung cho general Maintainer section của README).

## Project Quality

- Phải verify rằng dự án đã trải qua code review.
- Nên thảo luận và thiết lập testing goals và ambitions của dự án.
- Nên làm cho dễ sử dụng dự án - documentation, examples, pre-built releases, v.v.

## Release và Versioning

- Nên sử dụng [Semantic Versioning 2.0.0](https://semver.org/) và release tags.

## Security

Phần này của checklist dựa trên [Open Source Security Foundation (OpenSSF) guide for more secure open source development](https://github.com/ossf/wg-best-practices-os-developers/blob/main/docs/Concise-Guide-for-Developing-More-Secure-Software.md), phiên bản: 2023-06-14, [(và companion post)](https://openssf.org/blog/2024/04/15/open-source-security-openssf-and-openjs-foundations-issue-alert-for-social-engineering-takeovers-of-open-source-projects/).

### General

- Phải sử dụng two-factor authentication (2FA) hoặc multifactor authentication (MFA) để làm khó hơn cho account takeovers.
- Phải giới hạn merge và push rights cho các branches cụ thể.
- Phải đã enabled branch protection.
- Phải có thực hành signed commits.

- Nên có kiến thức cơ bản về committers và maintainers, và phải thực hiện periodic review của những người đó.
- Nên có automated testing và test coverage practices, bao gồm tests cho negative cases, để detect bugs và secure dự án.

### Contribution

- Nên có thực hành code reviews.
- Nên có yêu cầu readability và scope tốt để đảm bảo PRs mới không bị obfuscated, và việc sử dụng opaque binaries được minimize.

### Dependencies và Vulnerabilities Detection

- Phải sử dụng SCA-tools trong CI pipeline để detect vulnerabilities và license incompatibilities.
- Phải sử dụng linter tools trong CI pipeline để detect vulnerabilities và bad development practices.
- Phải sử dụng secret scanning tools để detect secrets (passwords, logs, tokens).
- Phải sử dụng automated tooling để monitor dependency updates cho critical vulnerabilities.
- Phải có maintenance để nhanh chóng xử lý updating vulnerabilities.

- Nên sử dụng SAST-tools trong CI pipeline để detect potential vulnerabilities và bad software practices.
- Nên evaluate health của mọi direct project dependency mới được thêm vào dự án.
- Nên prefer sử dụng package managers (ở system, language, và container level) cho automatic và consistent dependency updates.

### Publishing

- Phải tạo SBOM (Software Bill of Materials) cho dự án để end-users và systems có thể verify vulnerabilities và license incompatibilities.
- Phải giới hạn software publishing rights của artifacts.

- Nên sign bất kỳ project releases nào.
- Nên làm cho dễ dàng cho end-users upgrade lên releases mới. Sử dụng semantic versioning, hỗ trợ stable APIs, và flag deprecation sớm.

### Policy

- Phải có security policy - nó nên chứa thông tin về nơi báo cáo non-disclosure vulnerabilities và process liên quan đến report.

Secure software practices và tooling từ OpenSSF và OWASP:

### Tooling

- [OpenSSF guide to security tools](https://github.com/ossf/wg-security-tooling/blob/main/guide.md#readme).
- [OWASP Application Security Tools](https://owasp.org/www-community/Free_for_Open_Source_Application_Security_Tools)
- [OpenSSF Scorecards for repository security](https://github.com/ossf/scorecard)

### Guides

- [OpenSSF's Concise Guide for Evaluating Open Source Software](https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software)
- [CNCF Security TAG Software Supply Chain Best Practices guide](https://github.com/cncf/tag-security/blob/main/supply-chain-security/supply-chain-security-paper/CNCF_SSCP_v1.pdf).
- [OWASP Cheatsheets](https://cheatsheetseries.owasp.org/index.html).
- [OWASP Software Developer Guide](https://owasp.org/www-project-developer-guide/release/).
- [Signing artifacts in the supply chain - OpenSSF sigstore project](https://www.sigstore.dev/).
- [OWASP Application Security Verification Standard - ASVS](https://owasp.org/www-project-application-security-verification-standard/).
- [Supply-chain Levels for Software Artifacts - (SLSA)](https://slsa.dev/).

## Workflows

- Có thể thảo luận GitHub workflow của bạn - một tóm tắt ngắn gọn và suggestion có thể được tìm thấy trong [CONTRIBUTING - Pull Request Lifecycle](https://github.com/CTU-SematX/LegoCity/blob/main/CONTRIBUTING.md)

## Specifications và Standards cần tuân theo

Những điều sau sẽ giúp Open Source Project của bạn collaborative, reusable, accessible, và up-to-date.

- [REUSE License specification](https://reuse.software/)

  - Đảm bảo license compliance rõ ràng và chuẩn hóa trên toàn dự án.

- [Conventional Commits format](https://www.conventionalcommits.org/en/v1.1.0/)

  - Cung cấp project history rõ ràng và có cấu trúc thông qua standardized commit messages.

- [Keep-A-Changelog format](https://keepachangelog.com/en/1.1.0/)

  - Duy trì release history rõ ràng và user-friendly.

- [Semantic Versioning 2.0.0](https://semver.org/)

  - Cung cấp version numbering nhất quán cho releases.

- [Contributor Covenant guidelines](https://www.contributor-covenant.org/)

  - Thiết lập social contract cho collaboration respectful và inclusive.

- [OpenSSF Scorecard](https://scorecard.dev/)

  - Giúp assess và improve security health của dự án.

- [PublicCode.yml](https://yml.publiccode.tools/index.html)

  - Tạo điều kiện easy metadata indexing cho better discoverability của dự án.

- [Standard for Public Code](https://standard.publiccode.net/)
  - Đảm bảo dự án đáp ứng criteria cho public code quality và sustainability.
