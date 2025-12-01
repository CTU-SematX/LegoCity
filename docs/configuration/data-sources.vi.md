# Data and brokers

Trang này giải thích chi tiết cách **tầng dữ liệu (data layer)** của LegoCity được tổ chức xung quanh **NGSI-LD context broker** và **update server**.

Tập trung vào:

- broker cần lưu trữ và cung cấp những gì,
- dữ liệu được nhóm thành **domain** như thế nào,
- cách thiết kế và vận hành **update server**,
- cách ra quyết định về **history**, **chất lượng dữ liệu** và **source-of-truth**.

Trang này **không** đề cập lệnh triển khai hay tự động hóa hạ tầng; những phần đó được mô tả trong mục *Deployment*.

---

## 1. Overall data flow

Luồng dữ liệu cơ bản trong một deployment LegoCity:

1. Một hệ thống bên ngoài (ví dụ: weather API, sensor gateway, mô hình lũ, luồng dữ liệu giao thông) cung cấp dữ liệu thô (raw data).
2. Một **update server** cho domain đó đọc dữ liệu thô theo lịch (schedule).
3. Update server chuyển dữ liệu thô thành các **NGSI-LD entity** tuân theo các model và convention đã thống nhất.
4. Update server ghi các entity đó vào **context broker**.
5. Dashboard và các dịch vụ ứng dụng khác đọc entity từ broker (thường thông qua một **proxy**) và chuyển chúng thành các lớp bản đồ (map layer) và thành phần UI.

Những ràng buộc quan trọng:

- trong vận hành bình thường, **chỉ update server** mới ghi (write) vào broker,
- **broker là nguồn duy nhất** mà dashboard dùng để đọc city context,
- nếu một thứ **không nằm trong broker** thì nó **coi như không tồn tại** từ góc nhìn của LegoCity.

---

## 2. Context broker role

**Context broker** chịu trách nhiệm:

- lưu trữ toàn bộ **trạng thái hiện tại (current state)** của các city entity mà LegoCity cần,
- cung cấp một NGSI-LD API chuẩn cho create, update, query và subscription,
- cung cấp một góc nhìn nhất quán, chuẩn hóa (canonical) về “thành phố trông như thế nào ngay bây giờ”.

Từ góc nhìn LegoCity, broker phải:

- lưu trữ entity cho tất cả các domain nằm trong phạm vi (ví dụ: environment, flooding, mobility, public services),
- hỗ trợ **geospatial query** và lọc theo các thuộc tính (attribute) mà UI sẽ cần,
- xử lý được volume và tần suất cập nhật dự kiến của các entity.

Broker **không** được kỳ vọng sẽ:

- thực hiện các phân tích nặng (heavy analytics),
- render bản đồ,
- hiểu các khái niệm UI như page, block hay permission bên trong dashboard.

Những mối quan tâm đó thuộc về các thành phần ngoài broker.

### 2.1 What is stored in the broker

Với mỗi domain, broker lưu trữ:

- **entity identifier** biểu diễn các đối tượng hoặc quan trắc (observation) trong thế giới thực,
- giá trị hiện tại của các attribute (status, measurement, capacity, …),
- các thuộc tính không gian (geospatial attributes: location, geometry, coverage area),
- timestamp cho biết thời điểm thông tin được quan sát hoặc được cập nhật lần cuối.

Ví dụ những thứ thuộc phạm vi broker:

- “Có một flood zone với polygon này và mức độ rủi ro hiện tại này.”
- “Có một parking facility với sức chứa này và mức độ chiếm dụng hiện tại này.”
- “Có một weather observation tại vị trí này với nhiệt độ và độ ẩm như sau.”

Nếu dashboard cần hiển thị một giá trị cho người dùng, giá trị đó phải **có mặt** hoặc **suy ra được** từ các entity trong broker.

### 2.2 What is not stored in the broker

Broker **không bắt buộc** phải lưu:

- cấu hình UI (map style, default visibility của layer, bố cục panel),
- tài khoản người dùng, role hay permission,
- tài liệu hoặc nội dung mô tả chỉ liên quan tới admin UI.

Những thứ này thuộc về **PayloadCMS** hoặc các phần khác trong LegoCity stack.

---

## 3. Broker topology

Một deployment LegoCity phải quyết định chạy bao nhiêu **broker** và mỗi broker chịu trách nhiệm gì. Đây là quyết định mang tính cấu trúc, ảnh hưởng đến mọi phần khác của hệ thống.

### 3.1 Single-broker deployments

Trong một deployment **single-broker**:

- một instance broker lưu tất cả entity của deployment (tất cả domain, tất cả khu vực),
- tất cả update server ghi vào broker đó,
- tất cả dashboard và application service đọc từ broker đó.

Cách này thường được dùng mặc định cho:

- proof of concept,
- các deployment nhỏ đến vừa,
- một thành phố hoặc một campus đơn lẻ.

Ưu điểm:

- ít endpoint cần cấu hình hơn,
- monitoring và logging đơn giản hơn,
- dễ cho thành viên mới của team hiểu hệ thống.

Rủi ro và ràng buộc:

- nếu broker bị down, mọi domain đều bị ảnh hưởng,
- tất cả domain chia sẻ cùng giới hạn về hiệu năng và khả năng scale,
- cần đặt tên và phân phạm vi cẩn thận để tránh xung đột giữa các domain.

Trong thực tế, một deployment single-broker vẫn nên tách môi trường, ví dụ: một broker cho development và một broker cho production.

### 3.2 Multi-broker deployments

Trong một deployment **multi-broker**, các broker khác nhau được dùng cho các phạm vi (scope) khác nhau. Các pattern thường gặp:

- một broker cho mỗi environment (development, staging, production),
- một broker cho mỗi thành phố hoặc vùng hành chính,
- một broker dành cho high-frequency telemetry và một broker khác cho dữ liệu tham chiếu tĩnh hơn (reference data).

Ưu điểm:

- tách bạch rõ ràng giữa các môi trường hoặc các thành phố,
- có thể tinh chỉnh (tuning) và policy retention khác nhau cho từng broker,
- sự cố ở một broker không lập tức ảnh hưởng đến tất cả domain.

Chi phí và ràng buộc:

- nhiều endpoint và credential phải quản lý hơn,
- update server phải biết broker nào để ghi vào,
- dashboard và proxy phải được cấu hình để query đúng broker cho từng context.

Tài liệu của một deployment LegoCity nên liệt kê rõ:

- từng broker instance (tên và base URL),
- mỗi broker sở hữu những domain và entity type nào,
- những update server và application nào được phép truy cập từng broker.

---

## 4. Domains and ownership

Nếu không có cấu trúc, một broker có thể biến thành một đống entity ngẫu nhiên. LegoCity khuyến khích nhóm entity theo **domain** và gán trách nhiệm rõ ràng.

Các domain điển hình:

- Environment (weather, air quality, noise),
- Water and flooding,
- Mobility and transport,
- Public services (health, education, administration),
- Infrastructure assets (parking, charging stations, cameras).

Với mỗi domain, tài liệu nên ghi rõ:

- những entity type nào thuộc domain (theo tên `type`),
- update server nào chịu trách nhiệm tạo và cập nhật các entity đó,
- broker instance nào lưu các entity đó,
- dashboard hoặc map view nào tiêu thụ domain này.

Nhờ đó ta có câu trả lời rõ ràng cho các câu hỏi như:

- “Nếu dữ liệu flood sai, phải kiểm tra server nào?”
- “Dữ liệu air quality lấy từ đâu?”
- “Nếu thêm một thành phố mới, domain nào cần broker mới hoặc server mới?”

Domain là khái niệm về **tài liệu và ownership**, **không phải** một thành phần kỹ thuật mới.

---

## 5. Update servers

**Update server** là các **integration service**. Chúng kết nối hệ thống bên ngoài với context broker và là các thành phần **ghi entity thường xuyên** duy nhất.

### 5.1 Responsibilities

Một update server chịu trách nhiệm cho một vòng lặp đầy đủ:

1. **Configuration**  
   Đọc toàn bộ cấu hình từ environment variable hoặc file cấu hình, bao gồm:
   - broker URL và credential,
   - external API endpoint và key,
   - tần suất cập nhật và các tham số đặc thù domain (ví dụ: danh sách location cần monitor).

2. **Data ingestion**  
   Kết nối tới external data source:
   - lấy dữ liệu thô (fetch raw data),
   - xử lý paging, rate limit và lỗi tạm thời,
   - kiểm tra dữ liệu nhận được có cấu trúc hợp lệ hay không.

3. **Transformation**  
   Chuyển dữ liệu thô thành entity nội bộ:
   - chọn entity type,
   - đặt identifier theo convention của project,
   - điền các attribute khớp với Smart Data Model đã chọn,
   - gán location và timestamp.

4. **Publishing**  
   Ghi entity vào broker:
   - tạo entity nếu chưa tồn tại,
   - cập nhật attribute cho entity đã tồn tại,
   - xử lý lỗi một phần (partial failure) và retry khi phù hợp.

5. **Reporting and health**  
   Ghi log các sự kiện chính:
   - có bao nhiêu entity được tạo hoặc cập nhật,
   - lần cập nhật thành công gần nhất là khi nào,
   - có lỗi hay không, và lỗi loại gì.

Vòng lặp này có thể được triển khai như một service chạy liên tục với timer hoặc dưới dạng scheduled job.

### 5.2 Granularity and scope

Khuyến nghị là giữ scope của update server **hẹp và rõ ràng**:

- một server cho mỗi external data source,
- hoặc một server cho mỗi domain khi các nguồn dữ liệu liên quan chặt chẽ.

Điều này giúp tránh:

- trộn lẫn các mối quan tâm không liên quan trong cùng một codebase,
- để một lỗi làm ảnh hưởng nhiều domain,
- tạo ra các ràng buộc ẩn (hidden coupling) khó debug.

Mỗi server nên có tên và scope được tài liệu hóa rõ, ví dụ:

- `env-weather-server` – đọc weather API, ghi `WeatherObserved`,
- `water-flood-server` – đọc output của flood model, ghi `FloodZone`,
- `mobility-parking-server` – đọc backend parking, ghi `ParkingFacility` và `ParkingSpot`.

### 5.3 Idempotency and conflict handling

Update server nên được thiết kế **idempotent**:

- chạy cùng một update hai lần liên tiếp không được tạo ra entity trùng lặp,
- update phải luôn hội tụ về trạng thái đúng.

Điều này ảnh hưởng đến:

- cách sinh ID (ID ổn định hay ID random mới),
- cách áp dụng update (replace vs patch),
- cách xử lý entity bị xóa hoặc lỗi thời (xóa explicit, hoặc đánh dấu inactive).

Project nên định nghĩa rõ cách biểu diễn deletion và deactivation để UI diễn giải đúng (ví dụ: entity inactive được ẩn hay hiển thị khác màu).

---

## 6. Current state and history

NGSI-LD broker có thể hỗ trợ cả **current context** và **temporal query**, nhưng LegoCity phải quyết định rõ sẽ sử dụng khả năng này như thế nào.

### 6.1 Current state

Với nhiều dashboard, chỉ trạng thái hiện tại là quan trọng. Ví dụ:

- mực nước hiện tại,
- mức chiếm dụng parking hiện tại,
- mức độ rủi ro lũ hiện tại.

Ở mode này:

- broker giữ **một entity cho mỗi đối tượng thực**,
- mỗi lần update sẽ overwrite các attribute liên quan,
- các giá trị cũ không được giữ lại trong broker.

Cách này đơn giản hơn để vận hành và thường đủ cho các use case kiểu monitoring.

### 6.2 History and trends

Với một số use case, LegoCity có thể cần history ngắn hạn, ví dụ:

- biểu đồ 24 giờ gần nhất của weather hoặc air quality,
- diễn biến gần đây của mực nước trong một đợt lũ.

Có hai cách tiếp cận:

- dùng tính năng temporal của broker (nếu có và được bật) để lưu history attribute,
- forward dữ liệu sang một time-series database chuyên dụng trong khi chỉ giữ giá trị mới nhất trong broker.

Lựa chọn này nên được tài liệu hóa cho từng domain:

- domain nào chỉ lưu current state,
- domain nào giữ history giới hạn,
- dữ liệu analytics dài hạn được lưu ở đâu nếu không nằm trong broker.

Dashboard và proxy phải tuân theo quyết định này để query vừa thực tế vừa hiệu quả.

---

## 7. Data contracts and conventions

Để giữ data layer nhất quán, LegoCity dựa trên các **data contract** explicit giữa update server, broker và UI.

Các contract này bao phủ:

- dùng entity type nào,
- attribute nào bắt buộc phải có,
- tuân theo các quy ước đặt tên (naming convention) nào.

### 7.1 Entity types and models

Với mỗi entity type được dùng trong LegoCity, tài liệu nên nêu rõ:

- tên entity type (ví dụ: `WeatherObserved`),
- nó có theo **FIWARE Smart Data Model** trực tiếp, phiên bản mở rộng, hay schema tùy chỉnh,
- attribute nào là mandatory (luôn phải có),
- attribute nào là optional và xuất hiện trong điều kiện nào.

Update server phải tuân thủ các định nghĩa này khi create hoặc update entity.

### 7.2 Identifiers

Identifier (`id`) cần:

- ổn định theo thời gian cho cùng một đối tượng hoặc location trong thế giới thực,
- đủ dễ đoán để hệ thống khác có thể tham chiếu entity bằng ID nếu cần,
- là duy nhất trong toàn broker, hoặc ít nhất là duy nhất trong từng domain.

Tài liệu nên ghi rõ:

- ID được cấu trúc như thế nào (ví dụ: pattern URN bao gồm domain và location),
- ID được suy ra từ identifier của hệ thống bên ngoài hay được sinh nội bộ,
- xử lý thế nào nếu hệ thống bên ngoài đổi tên một đối tượng (ID có đổi theo không, và nếu có thì mapping ra sao).

### 7.3 Geospatial attributes

Vì LegoCity là hệ thống tập trung vào bản đồ, geospatial attribute phải nhất quán:

- dùng tên attribute nào cho vị trí (ví dụ: luôn dùng `location`),
- mỗi entity type dùng loại geometry nào (point, line, polygon),
- xử lý hệ tọa độ (coordinate reference system) ra sao (thường là WGS84).

Sự nhất quán này cho phép:

- các map layer generic có thể xử lý nhiều entity type,
- filter đơn giản theo bounding box hoặc area of interest.

### 7.4 Time attributes

Time là yếu tố then chốt cho context:

- mỗi entity kiểu observation nên có một observation timestamp rõ ràng,
- các entity biểu diễn đối tượng tĩnh (ví dụ: public facility) có thể có creation timestamp hoặc last-update timestamp.

Tài liệu nên liệt kê:

- attribute nào chứa thông tin thời gian,
- chúng được dùng thế nào trong UI (ví dụ: để đánh dấu dữ liệu stale).

---

## 8. Multiple sources for the same entity type

Đôi khi có nhiều hơn một external source cung cấp dữ liệu cho cùng một entity type khái niệm. Ví dụ, các cơ quan khác nhau có thể công bố các flood map trùng lặp một phần.

Trong những trường hợp đó, LegoCity cần rule rõ ràng để tránh nhầm lẫn:

- có source nào được coi là **authoritative** và các source khác bị bỏ qua không,
- entity từ các source khác nhau có được giữ tách biệt bằng ID và metadata không,
- có dùng một aggregation service riêng để kết hợp dữ liệu từ nhiều source thành một tập entity thống nhất hay không.

Nếu dùng nhiều source, tài liệu nên chỉ rõ cho mỗi entity type:

- những source nào feed vào loại này,
- conflict được giải quyết thế nào,
- attribute nào cho biết origin hoặc quality của từng entity.

---

## 9. Subscriptions and reactive flows

NGSI-LD hỗ trợ **subscription** để service được thông báo khi entity thay đổi. LegoCity có thể dùng subscription để kích hoạt workflow backend, nhưng **không dùng như cơ chế chính cho dashboard**.

Các cách dùng khả thi:

- một service cập nhật các indicator tổng hợp khi sensor entity thay đổi,
- một thành phần monitoring gửi cảnh báo khi vượt ngưỡng nào đó.

Nếu dùng subscription:

- cần xác định rõ component nào tạo và quản lý subscription,
- phạm vi subscription (entity type nào, điều kiện nào) phải được tài liệu hóa,
- cần định nghĩa chiến lược xử lý lỗi và khôi phục (điều gì xảy ra khi gửi notification thất bại).

Dashboard vẫn được kỳ vọng dùng **normal query**; mọi logic “push” nên được trung gian bởi application service.

---

## 10. Relationship to the dashboard and proxy

Data layer và UI layer giao tiếp với nhau qua một **narrow interface**.

Trong một setup điển hình:

- proxy layer cung cấp một tập nhỏ endpoint HTTP được thiết kế riêng cho UI,
- các endpoint này nội bộ sẽ query broker bằng NGSI-LD và chuyển kết quả sang cấu trúc đơn giản hơn,
- dashboard gọi các endpoint đó để lấy dữ liệu cần cho map view và block.

Hệ quả:

- chi tiết nội bộ của broker không bị lộ trực tiếp ra browser hoặc client không tin cậy,
- thay đổi trong cấu trúc entity có thể được hấp thụ ở layer proxy mà không làm vỡ UI ngay lập tức,
- policy bảo mật (ai được đọc cái gì) có thể được triển khai tập trung tại một nơi.

Thiết kế của các proxy endpoint được tài liệu trong phần *Development*; từ góc nhìn data layer, chỉ cần hiểu rằng:

- read access được tập trung (centralised),
- write access vẫn thuộc về update server,
- broker vẫn là **single source of truth**.

---

## 11. Summary

- Context broker lưu trữ biểu diễn hiện tại của thành phố dưới dạng NGSI-LD entity và được coi là **source of truth**.
- Mỗi deployment phải lựa chọn và tài liệu hóa broker topology (single broker hay multi-broker) và cấu trúc domain.
- Domain nhóm các entity type và update server liên quan; mỗi domain có ownership và trách nhiệm rõ ràng.
- Update server là các writer thường xuyên duy nhất vào broker và phải tuân theo **data contract** chung về cấu trúc entity, identifier, geospatial attribute và timestamp.
- Các quyết định về history, retention và multiple data source phải rõ ràng để dashboard và hệ thống analytics hoạt động dự đoán được.
- Dashboard đọc từ broker thông qua proxy, giữ cho mối quan tâm UI tách biệt với việc ingest và lưu trữ dữ liệu.
