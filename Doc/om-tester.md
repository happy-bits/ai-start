# Vad skiljer meningslösa tester från viktiga tester?

TL;DR:
- Meningslösa tester verifierar implementation och trivialiteter.
- Viktiga tester verifierar affärsbeteende, risker och kontrakt – och gör refaktorering trygg.

──────────────────────────────────────────────────────────────────────────────

KÄNNETECKEN: MENINGSLÖSA TESTER
- Testar det uppenbara (språk/ramverk/standardbiblio).
- Speglar implementationen rad-för-rad; bryts vid oskyldig refaktorering.
- Lågt signal/brus: ett fel säger inte om något viktigt gick sönder.
- Hårt kopplade till privata detaljer (interna klasser, ordning i listor utan krav).
- Små och många, men överlappar varandra och fångar inte verkliga buggar.
- Flaky (icke-deterministiska), tids-/sleep-baserade, beroende av klocka/nätverk utan kontroll.

KÄNNETECKEN: VIKTIGA TESTER
- Testar **beteende/kontrakt** (Given–When–Then), inte *hur*.
- Risk- och värdestyrda: kritiska flows, kantfall, felhantering, säkerhet, pengar, data-integritet.
- Robusta mot intern refaktorering; bryts bara när kravet faktiskt ändras.
- Snabba, isolerade, deterministiska; tydliga felmeddelanden.
- Täckning av gränser: min/max, tomma värden, dubbletter, ogiltig input, samtidighet.
- Skyddar mot regressioner och ökar förtroendet att våga ändra.

──────────────────────────────────────────────────────────────────────────────

EXEMPEL (Python/pytest)

# ❌ Meningslöst: testar standardbiblioteket och implementationens detalj
def test_list_append_adds_element():
    xs = []
    xs.append(1)
    assert xs == [1]

# ❌ Meningslöst: speglar logiken exakt; om implementationen kopieras hit
# kommer testet falla eller passera i takt med samma fel.
def test_calculate_discount_copies_code():
    price = 100
    # "testet" räknar om på samma sätt som produktionskoden
    expected = price * 0.9 if price > 50 else price
    assert calculate_discount(price) == expected

# ✅ Viktigt: testar affärskrav/kontrakt
def test_calculate_discount_behaviour():
    # Given: kundpris över gräns ger 10% rabatt
    assert calculate_discount(100) == 90
    # Given: exakt gränsvärde ger ingen rabatt (definierat krav)
    assert calculate_discount(50) == 50
    # Ogiltig input: negativt pris -> domänfel
    with pytest.raises(ValueError):
        calculate_discount(-1)

# ✅ Viktigt: felhantering och idempotens (kontrakt)
def test_apply_coupon_is_idempotent():
    order = Order(total=200)
    order.apply_coupon("SUMMER10")
    first = order.total
    order.apply_coupon("SUMMER10")
    assert order.total == first  # Samma kupong två gånger ändrar inte totalen

# ✅ Viktigt: kantfall + invariants
@pytest.mark.parametrize("qty, stock, ok", [(1,1,True),(2,1,False),(0,10,False)])
def test_reserve_stock_rules(qty, stock, ok):
    inv = Inventory(stock)
    if ok:
        inv.reserve(qty)
        assert inv.available == stock - qty
    else:
        with pytest.raises(DomainError):
            inv.reserve(qty)

# ✅ Viktigt: integration/kontrakt mot yttre system med tydlig avgränsning
def test_payment_gateway_contract(mock_gateway):
    mock_gateway.responses.authorize(success=True, auth_id="abc")
    result = pay(order_id="123", amount=500, gateway=mock_gateway)
    assert result.status == "AUTHORIZED"
    assert result.auth_id == "abc"

──────────────────────────────────────────────────────────────────────────────

SNABB HEURISTIK (“RCRCRC”):
- **R**isk: Kan detta gå sönder på ett sätt som skadar användaren/affären?
- **C**ritical: Är funktionen central (betalning, säkerhet, data)?
- **R**egulatory: Finns lag/kontrakt/SLAs?
- **C**omplex: Finns många grenar, samtidighet, asynk?
- **R**ecent change: Har koden nyligen ändrats?
- **C**ustomer-visible: Märks felet av kunden?

Ju fler ”ja”, desto mer motiverat är testet.

──────────────────────────────────────────────────────────────────────────────

DO-OR-DROP-CHECKLISTA FÖR ETT TEST
- Beskriver namnet ett observerbart beteende?
- Skulle en refaktorering utan kravändring få testet att falla? (Om ja → lukta.)
- Fångar testet ett kantfall/kontrakt/regel som inte är självklar?
- Är felet som fångas affärsrelevant och lätt att tolka?
- Går testet snabbt och deterministiskt?

Om du svarar ”nej” på flertalet → ta bort eller skriv om testet.

──────────────────────────────────────────────────────────────────────────────

MÄT DET SOM SPELAR ROLL
- Mutationspoäng (mutation testing) > rå täckningsgrad.
- Flaky-rate nära 0.
- Time-to-diagnose (hur snabbt fattar du varför det faller?).
- Färre, starkare tester som ger trygg refaktorering.

Kort sagt: **testa kontrakt och risk, inte implementation och trivialiteter**.
