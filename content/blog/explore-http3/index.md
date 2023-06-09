---
title: HTTP/3 살펴보기
date: "2023-05-05T19:09:18.164Z"
description: "HTTP의 최신버전인 HTTP/3의 등장배경과 변경된 내용을 알아봅니다"
category: 기술아티클
thumbnail: "../../../static/thumbnail/explore-http3.jpg"
---

## 들어가며

여전히 HTTP/1.1을 사용하는곳이 많고 최신버전이라고 할수있는 HTTP/2 버전이 등장한지 그리 오랜시간이 되지 않았는데 벌써 HTTP/3가 등장했고 실제 사용까지 되고 있습니다. 특히 HTTP/3는 기존의 HTTP와 달리 TCP가 아닌 UDP를 이용한다는점에서 어떻게 동작하는지, 왜 UDP를 사용하는지 궁금해질수밖에 없었습니다.

따라서 이 포스트에서는 HTTP/3에서 왜 TCP가 아니라 UDP를 사용하게 되었는지, 그리고 어떤 부분이 HTTP/2와 대비하여 개선되었는지 살펴보고자합니다.

## HTTP/3 개관

![http3](./http3.png)
HTTP/3는 UDP 기반의 QUIC 프로토콜을 사용하여 통신하며 원래는 이름이 HTTP-over-QUIC였지만, IETF 내에 있는 QUIC 작업 그룹의 의장인 마크 노팅업이 HTTP/3라는 이름을 제안하여 변경되었습니다.

즉 HTTP/3는 QUIC라는 프로토콜 기반으로 동작하기 때문에 HTTP/3는 UDP기반이라고 이야기 할수 있습니다. 이전버전까지는 신뢰성있는 통신을 위해 TCP를 사용하였는데 UDP를 이용하게 된데에는 이유가 존재합니다. 이를 살펴보기전에 기존 HTTP에서 발생하는 문제를 살펴보겠습니다.

### HTTP/2 까지의 문제점

HTTP/1.1버전부터 지속되던 한가지 문제는 바로 HOL이라는 문제였습니다. 선두 요청이 막히면 나머지 요청도 그대로 지연되는 문제였습니다. 다행이 스트림기반의 HTTP/2 버전부터는 HTTP자체의 HOLB은 해결할 수 있었지만, TCP 자체의 전송지연으로 인한 HOLB은 막을수 없었습니다.

한편 TCP는 새 연결을 설정하기 위해 핸드셰이크가 필요합니다. 이를 위해서는 양쪽 네트워크를 왕복해야하는데 클라이언트와 서버가 지리적으로 멀리 떨어져 있는 경우 각 RTT(왕복 시간)에 100밀리초 이상이 소요되어 눈에 띄는 지연이 발생할 수 있습니다.

### UDP 사용하기

TCP에서 HOL문제나 핸드셰이크 문제는 TCP를 수정해서 해결할 수 있지만, 수십년 동안 사용된 TCP를 수정하는것은 쉬운일이 아닙니다. 종단에 있는 클라이언트나 서버는 몰라도 중간의 라우터와 같은 서버장비, 방화벽 등은 이러한 기준에 쉽게 맞춰주지 않기 때문에 사실상 불가능에 가깝습니다.

그렇다면 새로운 전송계층의 프로토콜을 개발할수도 있습니다. 하지만 이것도 위와 비슷한 이유로 TCP/UDP체계에 맞추어진 인터넷 네트워크가 새로운 프로토콜에 적응하기까지 얼마나 많은 시간이 필요할지 알 수 없습니다. IP6가 나온지 20년이 넘었지만 여전히 NAT를 이용해 IP4를 사용하고 있는것을 생각해보면 이해할수 있습니다.

결국 프로토콜을 수정하거나 새로만드는것은 어렵다는것을 이해할수 있습니다. 그렇다면 남은 선택지는 UDP를 이용하는것인데, UDP에는 어떤 장점이 있는지 생각해봅시다. UDP는 간단한 역다중화/다중화 와 오류체크 이외의 어떤 기능도 하지 않습니다. 따라서 헤더도 작고 RTT(Round-Trip-Time,전송시간)도 작습니다. 이말을 바꾸어서 하면 하얀 도화지와 같은 프로토콜이라는 의미입니다. 애플리케이션 계층에서 기능을 구현하면 TCP와 동일한 기능을 구현할 수 있게됩니다.

따라서 HTTP/3(QUIC)는 HTTP/2의 기능을 그대로 가져가면서 초기 TCP가 고려하지 못했던 성능문제를 고려하여 재구현하게됩니다. 따라서 구현체 자체는 크게 변화하였지만 기능자체의 변화는 크지 않을수 있습니다.
오히려 1.1에서 2로의 변화가 더 클수 있습니다.

## 3.0 에서 개선된 사항들

### TLS와 결합됨

![http3TLS](./http3TLS.jpeg)
과거와 달리 보안에 드는 비용과 보안을 하지 않았을때의 피해를 고려할때 보안을 하지 않을때의 피해가 훨씬 크기 때문에 거의 대부분 보안을 필수로 생각합니다. 실제로 우리가 사용하는 웹사이트중에 https가 아닌곳을 생각해보면 이해하기 쉽습니다.

QUIC에서도 TCP에서 사용한 것과 같은 TLS를 사용하게되어서 방식은 동일합니다. 다만 몇가지 차이점이있는데, 첫째는 handshake와 함께 TLS도 진행하므로 2-RTT를 아낄수 있어 조금더 빠른 속도를 보장받을수 있습니다. 둘째는 원래 TLS는 애플리케이션의 데이터만을 암호화 하지만 헤더까지 모두 암호화하며 애플리케이션에서 TCP의 기능을 구현하다보니 마치 전송계층의 헤더까지 암호화 하는것 처럼 되어버립니다.

이로인해 몇가지 장단점이 발생합니다. 장점은 속도가 빠르고, 보안에 유리하지만, 이와 유사한 단점도 존재합니다. 추가적인 암호화가 진행되므로 암호화 오버헤드가 발생하고, 너무 많은 정보를 암호화해서 방화벽등에서 패킷의 성향을 판단하기 어려워서 차단할 가능성이 있다는것입니다.

### HOL 해결하기

![HOL](./holBlocking.webp)
HTTP 에는 꽤 고질적인 문제가 있는데 바로 HOL(Head Of Line) Blocking입니다. 이 문제는 버전에 따라 원인이 다르기 때문에 HTTP/1.1과 개선된 HTTP/2 각각에서 살펴보겠습니다.

#### HTTP/1.1 에서의 동작

http/1.1의 가장 큰 특징은 pipelining 과 persistance입니다. 즉 tcp연결을 매번 열자니 handshake 비용이 너무많이 드니 한번 열어서 여러 요청을 처리하자는것이 persistance이고, 한번에 하나의 요청을 보내고 받은뒤 다음 요청을 보내니 너무 오래걸리니 한번에 요청을 모두 보내자는것이 pipelining입니다.

여기서 발생하는 문제는 첫번째 요청에 대한 응답이 늦어지면, 나머지 응답이 모두 늦어지는것입니다. 순서대로 응답을 받아야하는 이유는 pipelining으로 여러 요청을 보낼때 요청을 식별하는 방법이 없어 보낸 순서로 식별을 하기 때문입니다. 따라서 요청을 한번에 보내기는 하지만 첫번째 요청이 밀리면 나머지도 동일하게 응답이 지연되는 현상이 발생합니다.

> 많은 웹서비스에서 HTTP/1.1을 사용하지만, 브라우저에서는 pipelining의 이러한 한계 때문에 pipelining을 잘 지원하지 않습니다. 대신 병렬요청을 가능하게 하기 위해서 TCP커넥션을 여러개 열어서 동시에 요청합니다. 다만 TCP연결 자체를 여러개 여는 것은 서버와 클라이언트 모두 부하가 발생하므로 보통 도메인당 6개이상의 요청을 보낼수 없게 되어있습니다. 이를 회피하기위해서 도메인 샤딩 기법을 사용할수 있는데, 이또한 DNS 쿼리지연시간과 요청 부하때문에 적절하게 사용하여야합니다.

#### http/2.0에서의 동작

HTTP/2는 multiflexing 스트림으로 요청을 동시에 보냅니다. 이때 스트림 패킷에는 스트림 식별자가 있어서 순서가 달라도 다른 요청을 구분할 수 있으므로 pipelining에서 HOL문제는 발생하지 않습니다. 왜냐하면 동시에 요청하고 동시에 응답을 받을수 있기 때문입니다. 하지만 TCP에서의 문제는 해결할수 없습니다.

TCP 신뢰성과 순서 보장을 위해서 버퍼를 두고, 만약 이후 번호가 먼저 도착하게되면 애플리케이션 레이어로 올려보내주지 않고 버퍼에 저장해둔뒤 이전 번호가 오는걸 기다립니다. 그결과 첫번째 요소가 오지 않게되면 나머지 요소가 올라갈수 없어서 문제가 발생합니다.

결국 HTTP 자체적인 HOL은 해결했지만 TCP내에서의 HOL은 해결할 수 없습니다. 왜냐하면 HTTP는 TCP 아래에서 동작하기 때문입니다.

#### HTTP/3에서 개선한 방식

HTTP/3에서는 요소들을 구분할 수 있게 되어 hol을 해결하게됩니다. HTTP/2에서는 다른 파일을 보내도 TCP입장에서는 모두 같은 파일이기 때문에 전송이 지연되지만, HTTP/3는 다른파일임을 알기 때문에 앞선 파일에서 손실이 발생해도 이후 파일을 잘 받았다면 응답을 보내줍니다. 따라서 가령 A,B,C 파일을 요청하는데, 중간에 B파일의 일부가 손실이 발생하면 HTTP/3는 A,B,C를 구분하기 때문에 A,C는 응답을 완료하고 B의 경우만 기다리게 되는것입니다.

> HTTP/1.1의 pipelining에서는 순서대로 응답을 받아야하지만 HTTP/2의 multiflexing에서는 순서대로 응답을 받지 않아도 됩니다.

### Connection ID를 활용한 반영구적 연결

![Connection ID](./connectionId.jpeg)
TCP는 연결을 구분하기위해서 목적지 IP, PORT, 발송지 IP,PORT 총 4가지 정보를 사용합니다. 따라서 클라이언트의 IP주소가 변경되면 연결이 끊어집니다. TCP가 등장했던 70년대에는 모바일 기기라는것이 없었기 때문에 합리적인 생각이었지만, 모바일 기기가 등장한 현대에는 클라이언트가 이동하게 됨으로써 기존의 방식은 동일한 기기사이의 통신인데도 새로운 연결을 만들어내야하므로 불필요한 지연시간을 가져옵니다.

따라서 HTTP/3는 Connection ID를 사용하여서 IP가 변경되더라도 연결이 상시적으로 유지될수 있도록 해줍니다. 동일한 Connection ID를 가지고 있다면 IP가 변경되더라도 동일한 연결임을 인지하고 재연결하지 않는것입니다.

### 마치며

QUIC가 TCP 대신 UDP를 사용했지만, 그렇다고 완전히 새로운것은 아닙니다. QUIC는 UDP를 기반으로 TCP의 기능을 재구현하면서 쌓여온 노하우를 이용해 특정부분을 개선한 프로토콜이기 때문입니다. 즉 HTTP/3의 목표는 UDP 위에서 TCP의 재구현입니다. 따라서 HTTP/2와 비교할때 기술적으로는 완전히 다를지는 몰라도, 기능적차이가 그렇게 크지는 않습니다. 이러한 이유때문에 HTTP/3이 HTTP/2가 등장한지 5년이 채 안되어 등장하지 않았나 싶습니다.

한편으로는 한번 정한 프로토콜을 교체하는것이 정말 쉽지 않다는것을 다시금 느끼게 된것 같습니다. 소규모 팀 프로젝트를 진행하더라도 코드 스타일 등을 변경하는것이 꽤 까다로운일인데, 프로토콜은 전세계적인 규약이니 만큼 매우 어렵다는 생각이 들고, 설계를 할때 변경에 강한 프로토콜을 설계하는것도 변화에 대응하기 좋은 방식이 아닐까 생각이 듭니다.

### 레퍼런스

<a class="link" href="https://likelionsungguk.github.io/21-08-14/%EC%B2%98%EC%9D%8C%EB%B6%80%ED%84%B0-%EB%81%9D%EA%B9%8C%EC%A7%80-%EC%83%81%EC%84%B8%ED%9E%88-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90!-HTTP3%EC%97%90-%EB%8C%80%ED%95%9C-A-TO-Z">처음부터 끝까지 상세히 알아보자! - HTTP/3에 대한 A TO Z (1)</a>
<a class="link" href="https://likelionsungguk.github.io/21-08-22/%EC%B2%98%EC%9D%8C%EB%B6%80%ED%84%B0-%EB%81%9D%EA%B9%8C%EC%A7%80-%EC%83%81%EC%84%B8%ED%9E%88-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90!-HTTP3%EC%97%90-%EB%8C%80%ED%95%9C-A-TO-Z(2)">처음부터 끝까지 상세히 알아보자! - HTTP/3에 대한 A TO Z (2)</a>
<a class="link" href="https://velog.io/@dnr6054/HOL-Blocking">HOL Blocking 이란?</a>
