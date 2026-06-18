from hello import greet


def test_default_greeting():
    assert greet() == "Hello, World!"


def test_custom_greeting():
    assert greet("Alice") == "Hello, Alice!"
