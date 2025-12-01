# Dữ liệu và broker

Trang này giải thích chi tiết cách **lớp dữ liệu** của LegoCity được tổ chức xung quanh các NGSI-LD context broker và update server.

Trang này tập trung vào:

- broker dự kiến lưu trữ và cung cấp gì,
- cách dữ liệu được nhóm thành các domain,
- cách các update server được thiết kế và vận hành,
- cách các quyết định về lịch sử, chất lượng và nguồn dữ liệu được đưa ra.

Trang này không đề cập đến các lệnh triển khai hoặc tự động hóa cơ sở hạ tầng; những điều đó được ghi lại trong phần Triển khai.

---

## 1. Luồng dữ liệu tổng thể

Luồng dữ liệu cơ bản trong triển khai LegoCity là:

1. Một hệ thống bên ngoài (ví dụ: API thời tiết, gateway cảm biến, mô hình lũ lụt, nguồn cấp vận tải) expose dữ liệu thô.
2. Một update server cho domain đó đọc dữ liệu thô theo lịch trình.
3. Update server chuyển đổi dữ liệu thô thành **NGSI-LD entity** tuân theo các mô hình và quy ước đã thỏa thuận.
4. Update server ghi các entity đó vào một **context broker**.
5. Dashboard và các dịch vụ ứng dụng khác đọc entity từ broker (thường qua proxy) và biến chúng thành các lớp bản đồ và phần tử UI.

Các ràng buộc quan trọng là:

- update server là các thành phần duy nhất ghi vào broker trong hoạt động bình thường,
- broker là nguồn duy nhất mà dashboard đọc ngữ cảnh thành phố,
- nếu một cái gì đó không có trong broker, nó không tồn tại từ quan điểm của LegoCity.

---

## 2. Vai trò của context broker

Context broker chịu trách nhiệm cho:

- lưu trữ tất cả **trạng thái hiện tại** của các entity thành phố mà LegoCity cần,
- expose một API NGSI-LD chuẩn để tạo, cập nhật, truy vấn và subscription,
- cung cấp một view nhất quán, chuẩn hóa về "thành phố trông như thế nào hiện tại".

Từ quan điểm của LegoCity, broker phải:

- lưu trữ entity cho tất cả các domain trong phạm vi (ví dụ: môi trường, lũ lụt, di chuyển, dịch vụ công),
- hỗ trợ các truy vấn không gian địa lý và lọc trên các thuộc tính mà UI sẽ cần,
- xử lý khối lượng và tần suất cập nhật dự kiến của các entity.

Broker không được mong đợi để:

- thực hiện phân tích nặng,
- render bản đồ,
- nhận biết các khái niệm UI như trang, khối hoặc quyền bên trong dashboard.

Những mối quan tâm đó là bên ngoài broker.

### 2.1 Những gì được lưu trữ trong broker

Đối với mỗi domain, broker lưu trữ:

- định danh entity đại diện cho các đối tượng hoặc quan sát trong thế giới thực,
- giá trị hiện tại của các thuộc tính (trạng thái, đo lường, năng lực, v.v.),
- thuộc tính không gian địa lý (vị trí, hình học, khu vực bao phủ),
- timestamp cho biết thông tin được quan sát hoặc cập nhật lần cuối khi nào.

Ví dụ về những gì nằm trong phạm vi của broker:

- "Có một vùng lũ lụt với đa giác này và mức độ rủi ro hiện tại này."
- "Có một cơ sở đỗ xe với sức chứa này và tỷ lệ lấp đầy hiện tại này."
- "Có một quan sát thời tiết tại vị trí này với nhiệt độ và độ ẩm này."

Nếu dashboard cần hiển thị một giá trị cho người dùng, giá trị đó phải có hoặc có thể suy ra từ các entity trong broker.

### 2.2 Những gì không được lưu trữ trong broker

Broker không bắt buộc phải lưu trữ:

- cấu hình UI (kiểu bản đồ, giá trị mặc định hiển thị lớp, bố cục panel),
- tài khoản người dùng, vai trò hoặc quyền,
- tài liệu hoặc văn bản mô tả chỉ liên quan đến UI quản trị.

Các mục này thuộc về PayloadCMS hoặc các phần khác của stack LegoCity.

---

## 3. Cấu trúc broker

Một triển khai LegoCity phải chọn chạy bao nhiêu broker và mỗi broker chịu trách nhiệm về gì. Đây là một quyết định cấu trúc ảnh hưởng đến mọi phần khác của hệ thống.

### 3.1 Triển khai broker đơn

Trong triển khai broker đơn:

- một instance broker lưu trữ tất cả các entity cho triển khai (tất cả các domain, tất cả các khu vực thành phố),
- tất cả các update server ghi vào broker đó,
- tất cả các dashboard và dịch vụ ứng dụng đọc từ broker đó.

Đây thường là mặc định cho:

- bằng chứng về khái niệm,
- triển khai nhỏ đến trung bình,
- một thành phố hoặc khuôn viên duy nhất.

Ưu điểm:

- ít endpoint hơn để cấu hình,
- giám sát và logging đơn giản hơn,
- dễ dàng hơn cho các thành viên mới trong nhóm để hiểu.

Rủi ro và ràng buộc:

- nếu broker không khả dụng, tất cả các domain đều bị ảnh hưởng,
- tất cả các domain chia sẻ cùng một giới hạn hiệu suất và mở rộng,
- cần đặt tên và phạm vi cẩn thận để tránh xung đột giữa các domain.

Trong thực tế, một triển khai broker đơn vẫn nên tách các môi trường (ví dụ: một broker cho development và một cho production).

### 3.2 Triển khai nhiều broker

Trong triển khai nhiều broker, các broker khác nhau được sử dụng cho các phạm vi khác nhau. Các mẫu phổ biến:

- một broker cho mỗi môi trường (development, staging, production),
- một broker cho mỗi thành phố hoặc khu vực hành chính,
- một broker cho telemetry tần suất cao và một broker khác cho dữ liệu tham chiếu tĩnh hơn.

Ưu điểm:

- tách biệt rõ ràng hơn giữa các môi trường hoặc thành phố,
- chính sách điều chỉnh và lưu giữ khác nhau cho mỗi broker,
- lỗi trong một broker không ảnh hưởng ngay lập tức đến tất cả các domain.

Chi phí và ràng buộc:

- nhiều endpoint và thông tin xác thực hơn để quản lý,
- các update server phải biết ghi vào broker nào,
- dashboard và proxy phải được cấu hình để truy vấn broker chính xác cho mỗi ngữ cảnh.

Tài liệu của triển khai LegoCity nên liệt kê rõ ràng:

- mỗi instance broker (tên và URL cơ sở),
- domain và loại entity nào mà mỗi broker sở hữu,
- update server và ứng dụng nào được phép truy cập mỗi broker.

---

## 4. Domain và quyền sở hữu

Không có cấu trúc, một broker có thể trở thành một tập hợp ngẫu nhiên các entity. LegoCity khuyến khích nhóm các entity thành **domain** và gán trách nhiệm rõ ràng.

Các domain điển hình là:

- Môi trường (thời tiết, chất lượng không khí, tiếng ồn),
- Nước và lũ lụt,
- Di chuyển và vận tải,
- Dịch vụ công (y tế, giáo dục, hành chính),
- Tài sản cơ sở hạ tầng (đỗ xe, trạm sạc, camera).

Đối với mỗi domain, tài liệu nên nêu rõ:

- loại entity nào thuộc về nó (theo tên `type`),
- update server nào chịu trách nhiệm tạo và cập nhật các entity đó,
- instance broker nào lưu trữ các entity đó,
- dashboard hoặc view bản đồ nào tiêu thụ domain đó.

Điều này đưa ra câu trả lời rõ ràng cho các câu hỏi như:

- "Nếu dữ liệu lũ lụt sai, chúng ta nên kiểm tra server nào?"
- "Dữ liệu chất lượng không khí đến từ đâu?"
- "Nếu chúng ta thêm một thành phố mới, domain nào cần broker mới hoặc server mới?"

Domain là một khái niệm tài liệu và quyền sở hữu; chúng không phải là một thành phần kỹ thuật mới.

---

## 5. Update server

Update server là **dịch vụ tích hợp**. Chúng kết nối các hệ thống bên ngoài với context broker và là các writer thường xuyên duy nhất của các entity.

### 5.1 Trách nhiệm

Một update server chịu trách nhiệm cho một vòng lặp hoàn chỉnh:

1. **Cấu hình**  
   Nó đọc tất cả cấu hình của nó từ các biến môi trường hoặc file cấu hình, bao gồm:

   - URL broker và thông tin xác thực,
   - endpoint API bên ngoài và khóa,
   - tần suất cập nhật và bất kỳ tham số domain-specific nào (ví dụ: danh sách các vị trí để giám sát).

2. **Thu thập dữ liệu**  
   Nó liên hệ với các nguồn dữ liệu bên ngoài:

   - lấy dữ liệu thô,
   - xử lý phân trang, giới hạn tốc độ và lỗi tạm thời,
   - xác thực rằng dữ liệu nhận được có cấu trúc hợp lệ.

3. **Chuyển đổi**  
   Nó chuyển đổi dữ liệu thô thành biểu diễn entity nội bộ:

   - chọn loại entity,
   - đặt định danh theo các quy ước của dự án,
   - điền các thuộc tính khớp với Smart Data Model đã chọn,
   - đặt vị trí và timestamp.

4. **Xuất bản**  
   Nó ghi entity vào broker:

   - tạo các entity chưa tồn tại,
   - cập nhật thuộc tính cho các entity hiện có,
   - xử lý các lỗi một phần và retry khi thích hợp.

5. **Báo cáo và sức khỏe**  
   Nó ghi log các sự kiện chính:
   - bao nhiêu entity đã được tạo hoặc cập nhật,
   - khi nào cập nhật thành công lần cuối xảy ra,
   - có lỗi hay không và loại gì.

Vòng lặp này có thể được triển khai như một dịch vụ chạy liên tục với một bộ đếm thời gian hoặc như một công việc được lên lịch.

### 5.2 Mức độ chi tiết và phạm vi

Phương pháp được khuyến nghị là giữ các update server có phạm vi hẹp:

- một server cho mỗi nguồn dữ liệu bên ngoài,
- hoặc một server cho mỗi domain khi các nguồn được liên kết chặt chẽ.

Điều này tránh:

- trộn lẫn các mối quan tâm không liên quan trong một codebase duy nhất,
- làm cho một lỗi ảnh hưởng đến nhiều domain,
- tạo ra các coupling ẩn khó debug.

Mỗi server nên có một tên rõ ràng và phạm vi được ghi lại, ví dụ:

- `env-weather-server` – đọc API thời tiết, ghi `WeatherObserved`,
- `water-flood-server` – đọc đầu ra mô hình lũ lụt, ghi `FloodZone`,
- `mobility-parking-server` – đọc backend đỗ xe, ghi `ParkingFacility` và `ParkingSpot`.

### 5.3 Idempotency và xử lý xung đột

Update server nên được thiết kế để **idempotent**:

- chạy cùng một cập nhật hai lần liên tiếp không nên tạo các entity trùng lặp,
- các cập nhật nên luôn hội tụ về trạng thái chính xác.

Điều này có ý nghĩa đối với:

- cách tạo ID (ID ổn định vs ID ngẫu nhiên mới),
- cách áp dụng cập nhật (replace vs patch),
- cách xử lý các entity đã xóa hoặc lỗi thời (xóa rõ ràng, hoặc đánh dấu là không hoạt động).

Dự án nên xác định cách biểu diễn việc xóa và vô hiệu hóa, để UI có thể diễn giải chúng một cách chính xác (ví dụ: các entity không hoạt động có bị ẩn hay được tạo kiểu khác đi).

---

## 6. Trạng thái hiện tại và lịch sử

Các NGSI-LD broker có thể hỗ trợ cả truy vấn **ngữ cảnh hiện tại** và **temporal**, nhưng LegoCity phải xác định cách sử dụng khả năng này.

### 6.1 Trạng thái hiện tại

Đối với nhiều dashboard, chỉ trạng thái hiện tại quan trọng. Ví dụ:

- mức nước hiện tại,
- tỷ lệ lấp đầy đỗ xe hiện tại,
- mức độ rủi ro lũ lụt hiện tại.

Trong chế độ này:

- broker giữ một entity cho mỗi đối tượng trong thế giới thực,
- mỗi cập nhật ghi đè các thuộc tính có liên quan,
- các giá trị cũ không được giữ trong broker.

Điều này đơn giản hơn để vận hành và thường đủ cho các trường hợp sử dụng theo kiểu giám sát.

### 6.2 Lịch sử và xu hướng

Đối với một số trường hợp sử dụng, LegoCity có thể cần lịch sử ngắn hạn, ví dụ:

- biểu đồ của 24 giờ gần đây về thời tiết hoặc chất lượng không khí,
- sự phát triển gần đây của mức nước trong một sự kiện lũ lụt.

Hai phương pháp có thể:

- sử dụng các tính năng temporal của broker (nếu có và được bật) để lưu trữ lịch sử thuộc tính,
- chuyển tiếp dữ liệu sang một cơ sở dữ liệu chuỗi thời gian chuyên biệt trong khi chỉ giữ các giá trị mới nhất trong broker.

Lựa chọn nên được ghi lại cho mỗi domain:

- domain nào chỉ lưu trữ trạng thái hiện tại,
- domain nào giữ lại lịch sử hạn chế,
- dữ liệu phân tích dài hạn được lưu trữ ở đâu nếu không có trong broker.

Dashboard và proxy phải được căn chỉnh với quyết định này để các truy vấn thực tế và hiệu quả.

---

## 7. Hợp đồng dữ liệu và quy ước

Để giữ lớp dữ liệu mạch lạc, LegoCity dựa vào các **hợp đồng dữ liệu** rõ ràng giữa các update server, broker và UI.

Các hợp đồng này bao gồm:

- loại entity nào được sử dụng,
- thuộc tính nào phải có,
- quy ước đặt tên nào được tuân theo.

### 7.1 Loại entity và mô hình

Đối với mỗi loại entity được sử dụng trong LegoCity, tài liệu nên chỉ định:

- tên của loại entity (ví dụ: `WeatherObserved`),
- liệu nó tuân theo FIWARE Smart Data Model trực tiếp, một phiên bản mở rộng, hay một schema tùy chỉnh,
- thuộc tính nào là bắt buộc (phải luôn có),
- thuộc tính nào là tùy chọn và trong điều kiện nào chúng xuất hiện.

Update server phải tôn trọng các định nghĩa này khi tạo hoặc cập nhật entity.

### 7.2 Định danh

Định danh (`id`) cần phải:

- ổn định theo thời gian cho cùng một đối tượng hoặc vị trí trong thế giới thực,
- đủ dự đoán được để các hệ thống có thể tham chiếu đến entity bằng ID nếu cần,
- duy nhất trong broker, hoặc ít nhất trong một domain.

Tài liệu nên nêu rõ:

- cách xây dựng ID (ví dụ: các mẫu URN bao gồm domain và vị trí),
- liệu ID có được lấy từ định danh bên ngoài hay được tạo nội bộ,
- cách xử lý thay đổi ID nếu một hệ thống bên ngoài đổi tên một cái gì đó.

### 7.3 Thuộc tính không gian địa lý

Vì LegoCity tập trung vào bản đồ, các thuộc tính không gian địa lý phải nhất quán:

- tên thuộc tính nào được sử dụng cho vị trí (ví dụ: luôn luôn là `location`),
- loại hình học nào được mong đợi cho mỗi loại entity (điểm, đường, đa giác),
- cách xử lý hệ thống tham chiếu tọa độ (thường là WGS84).

Sự nhất quán này cho phép:

- các lớp bản đồ chung có thể xử lý nhiều loại entity,
- lọc đơn giản theo bounding box hoặc khu vực quan tâm.

### 7.4 Thuộc tính thời gian

Thời gian rất quan trọng đối với ngữ cảnh:

- mỗi entity kiểu quan sát nên có một timestamp quan sát rõ ràng,
- các entity đại diện cho các đối tượng tĩnh (ví dụ: một cơ sở công) có thể có timestamp tạo hoặc cập nhật lần cuối.

Tài liệu nên liệt kê:

- thuộc tính nào mang thông tin thời gian,
- cách chúng được sử dụng trong UI (ví dụ: để đánh dấu dữ liệu cũ).

---

## 8. Nhiều nguồn cho cùng một loại entity

Đôi khi nhiều hơn một nguồn bên ngoài có thể cung cấp dữ liệu cho cùng một loại entity khái niệm. Ví dụ: các cơ quan khác nhau có thể xuất bản các bản đồ lũ lụt chồng chéo một phần.

Trong những trường hợp như vậy, LegoCity cần các quy tắc rõ ràng để tránh nhầm lẫn:

- liệu một nguồn có được coi là nguồn **có thẩm quyền** và các nguồn khác bị bỏ qua,
- liệu các entity từ các nguồn khác nhau có được giữ riêng biệt bằng ID và metadata,
- liệu một dịch vụ tổng hợp chuyên dụng có kết hợp dữ liệu từ nhiều nguồn thành một tập entity duy nhất.

Nếu nhiều nguồn được sử dụng, tài liệu nên chỉ định cho mỗi loại entity:

- nguồn nào cung cấp loại này,
- cách giải quyết xung đột,
- thuộc tính nào cho biết nguồn gốc hoặc chất lượng của mỗi entity.

---

## 9. Subscription và luồng phản ứng

NGSI-LD hỗ trợ subscription để các dịch vụ có thể được thông báo khi entity thay đổi. LegoCity có thể sử dụng subscription để thúc đẩy các quy trình backend, nhưng không phải như một cơ chế chính cho dashboard.

Các cách sử dụng có thể bao gồm:

- một dịch vụ cập nhật các chỉ số tổng hợp khi các entity cảm biến thay đổi,
- một thành phần giám sát cảnh báo khi vượt qua một số ngưỡng nhất định.

Nếu subscription được sử dụng:

- các thành phần tạo và quản lý subscription nên được xác định,
- phạm vi của subscription (loại entity nào, điều kiện nào) nên được ghi lại,
- các chiến lược xử lý lỗi và khôi phục nên được xác định (điều gì xảy ra khi việc gửi thông báo thất bại).

Dashboard được mong đợi tiếp tục sử dụng các truy vấn bình thường; bất kỳ logic "push" nào nên được trung gian bởi các dịch vụ ứng dụng.

---

## 10. Mối quan hệ với dashboard và proxy

Lớp dữ liệu và lớp UI giao tiếp thông qua một giao diện hẹp.

Trong một thiết lập điển hình:

- lớp proxy expose một tập nhỏ các endpoint HTTP được tùy chỉnh cho UI,
- các endpoint này truy vấn broker nội bộ bằng NGSI-LD và chiếu các kết quả thành các cấu trúc đơn giản hơn,
- dashboard gọi các endpoint này để lấy dữ liệu cần thiết cho các view bản đồ và khối.

Hệ quả:

- các chi tiết nội bộ của broker không được expose trực tiếp ra trình duyệt hoặc client không đáng tin cậy,
- các thay đổi trong cấu trúc entity có thể được hấp thụ bởi proxy mà không phá vỡ ngay lập tức UI,
- các chính sách bảo mật (ai có thể đọc gì) có thể được triển khai ở một nơi.

Thiết kế của các proxy endpoint này được ghi lại trong phần Development; từ quan điểm lớp dữ liệu, chỉ cần hiểu rằng:

- quyền truy cập đọc được tập trung,
- quyền truy cập ghi vẫn với các update server,
- broker vẫn là nguồn dữ liệu duy nhất.

---

## 11. Tóm tắt

- Context broker lưu trữ biểu diễn hiện tại của thành phố dưới dạng các NGSI-LD entity và được coi là nguồn dữ liệu.
- Một triển khai phải chọn và ghi lại cấu trúc broker của nó (broker đơn hoặc nhiều broker) và cấu trúc domain.
- Domain nhóm các loại entity liên quan và update server; mỗi domain có quyền sở hữu và trách nhiệm rõ ràng.
- Update server là các writer thường xuyên duy nhất vào broker và phải tuân theo các hợp đồng dữ liệu được chia sẻ cho cấu trúc entity, định danh, thuộc tính không gian địa lý và timestamp.
- Các quyết định về lịch sử, lưu giữ và nhiều nguồn dữ liệu phải rõ ràng để dashboard và phân tích hoạt động dự đoán được.
- Dashboard đọc từ broker thông qua proxy, giữ các mối quan tâm UI được tách biệt rõ ràng khỏi việc thu thập và lưu trữ dữ liệu.
