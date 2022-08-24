import { useState, useEffect, useRef } from "react";
import "./App.css";
import { GiDogHouse } from "react-icons/gi";
import { FaUserAstronaut } from "react-icons/fa";
import { IoAddOutline } from "react-icons/io5";
import { MdSend } from "react-icons/md";

import Emoji from "react-emoji-render";

import {
  Flex,
  Input,
  Button,
  Center,
  Box,
  Text,
  useDisclosure,
  Collapse,
  Image,
  Grid,
  GridItem,
  InputGroup,
  InputRightElement,
  Textarea,
  CloseButton,
} from "@chakra-ui/react";

import { io } from "socket.io-client";

if (REACT_APP_BACKEND_URL) {
  (url = REACT_APP_BACKEND_URL), { transports: ["websockets"] };
} else url = "http://localhost:4000";

const socket = io(url);

function App() {
  const handleKeyDown = (e) => {
    e.target.style.height = "inherit";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const { isOpen, onToggle, onClose, onOpen } = useDisclosure();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regClientID, setRegClientID] = useState("");

  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const [typing, setTyping] = useState("");

  const [randomColor, setRandomColor] = useState("");
  const [avatar, setAvatar] = useState("");

  const [room, setRoom] = useState("");
  const [regRoom, setRegRoom] = useState("");
  const [rooms, setRooms] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    socket.on("connection", (data) => {
      setRooms(data.rooms);
      setUsers(data.users);
    });

    socket.on("get_users", (data) => {
      setUsers(data);
      setErrorMessage("");
    });

    socket.on("joined_room", (data) => {
      setRooms(data);
      setErrorMessage("");
    });

    socket.on("active_users", (activeUsers) => {
      setActiveUsers(activeUsers);
    });

    socket.on("deleted_room", (data) => {
      setRooms(data);
      setErrorMessage("");
    });

    socket.on("current_room", (data) => {
      setMessages(data);
      setErrorMessage("");
    });

    socket.on("registered_user", (user) => {
      setRegClientID(user.user_id);
      setRegUsername(user.username);
      setUsername("");
      setErrorMessage("");
    });

    socket.on("registered_room", (room) => {
      setRegRoom(room.room_name);
      setRoom("");
      setErrorMessage("");
    });

    socket.on("error_message", (error) => {
      setErrorMessage(error);
    });

    socket.on("sent_message", (data) => {
      setMessages(data);
      setErrorMessage("");
    });

    socket.on("is_typing", ({ typingState, username }) => {
      if (typingState) setTyping(`${username} is typing...`);
      if (!typingState) setTyping("");
    });

    return () => socket.off();
  }, []);

  const handleMessage = (message) => {
    socket.emit("chat_message", {
      message,
      clientID: regClientID,
      username: regUsername,
      randomColor,
      avatar,
      room: regRoom,
    });
  };

  const handleUser = (username) => {
    const random = Math.floor(Math.random() * 16777215).toString(16);
    setRandomColor(random);
    setAvatar(
      `https://avatars.dicebear.com/api/pixel-art-neutral/${username}.svg`
    );
    socket.emit("register", username);
  };

  const joinRoom = (roomName) => {
    socket.emit("join_room", { roomName, username: regUsername });
  };

  const deleteRoom = (roomName) => {
    socket.emit("delete_room", roomName);
  };

  const deleteUser = (regClientID) => {
    // Deletes all users under the same socket.id
    socket.emit("delete_users", regClientID);
    onToggle();
  };

  const deleteAllUsers = () => {
    socket.emit("delete_all_users");
    onToggle();
  };

  const handleTyping = (typingState) => {
    socket.emit("handle_typing", {
      typingState,
      username: regUsername,
      room: regRoom,
    });
  };

  return (
    <div className="App">
      <Center display="flex">
        <Grid
          border="4px solid black"
          bg="gray.200"
          templateRows="repeat(6, 1fr)"
          templateColumns="repeat(4, 1fr)"
          m={1}
        >
          <GridItem bgColor="black" rowSpan={1} colSpan={4} px={2}>
            <Flex flexDir="column">
              <Flex
                justifyContent="space-between"
                alignItems="center"
                gap={2}
                p={2}
              >
                <Text fontSize="2xl" fontWeight="medium" color="white">
                  {regClientID
                    ? `Welcome ${regUsername}...`
                    : "Waiting for registration..."}
                </Text>
                <Text color="white">{errorMessage}</Text>
                <Flex flexDir="column">
                  <Button
                    colorScheme="purple"
                    onClick={() => deleteUser(regClientID)}
                    width="200px"
                    size="sm"
                  >
                    Disconnect your active users
                  </Button>
                  <Collapse in={isOpen}>
                    <Button
                      color="white"
                      size="sm"
                      width="200px"
                      bg="red"
                      onClick={() => deleteAllUsers()}
                    >
                      Disconnect all users
                    </Button>
                  </Collapse>
                </Flex>
              </Flex>
            </Flex>
          </GridItem>
          <GridItem
            bgColor="black"
            color="white"
            rowSpan={5}
            colSpan={1}
            alignSelf="flex-start"
            px={2}
            minH="100%"
            maxH="400px"
            overflowY="scroll"
            css={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <Flex flexDir="column" alignItems="flex-start">
              <Flex flexDir="column" px={1} mx={1} alignItems="flex-start">
                <Flex alignItems="center" gap={2}>
                  <FaUserAstronaut />
                  <Text fontWeight="bold">Users</Text>
                </Flex>
                <Flex>
                  <InputGroup>
                    <InputRightElement
                      onClick={() => {
                        handleUser(username);
                      }}
                      children={<IoAddOutline />}
                    />
                    <Input
                      placeholder="Join chat"
                      variant="outline"
                      maxW="150px"
                      value={username}
                      color={
                        errorMessage === "User already exist" ||
                        errorMessage === "Please enter a username"
                          ? "red"
                          : "blue.300"
                      }
                      // disabled={regClientID && true}
                      fontSize="lg"
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={(e) => {
                        // && !regClientID
                        if (e.key === "Enter") {
                          handleUser(username);
                        }
                      }}
                    />
                  </InputGroup>
                </Flex>
                {users &&
                  users.map((user) => (
                    <Text
                      mx={6}
                      key={user.username}
                      color={regUsername === user.username && "blue.300"}
                      fontWeight={regUsername === user.username && "bold"}
                    >
                      {user.username}
                    </Text>
                  ))}
              </Flex>
              <Flex flexDir="column" p={1} m={1}>
                <Flex alignItems="center" gap={2}>
                  <GiDogHouse />
                  <Text fontWeight="bold">Rooms</Text>
                </Flex>
                <InputGroup>
                  <InputRightElement
                    children={<IoAddOutline />}
                    onClick={() => {
                      joinRoom(room);
                    }}
                  />
                  <Input
                    placeholder="Add room"
                    variant="outline"
                    maxW="150px"
                    value={room}
                    fontSize="lg"
                    onChange={(e) => {
                      setRoom(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        joinRoom(room);
                      }
                    }}
                  />
                </InputGroup>
                {rooms &&
                  rooms.map((roomItem) => (
                    <Flex
                      color="white"
                      alignItems="center"
                      justifyContent="space-between"
                      key={roomItem.id}
                      bgColor={
                        regRoom === roomItem.room_name ? "gray.700" : "black"
                      }
                    >
                      <Button
                        m={0}
                        width="90%"
                        onClick={() => {
                          joinRoom(roomItem.room_name);
                          setRegRoom(roomItem.room_name);
                        }}
                        bgColor={
                          regRoom === roomItem.room_name ? "gray.700" : "black"
                        }
                        _hover={{
                          bg: "green.400",
                        }}
                      >
                        {roomItem.room_name}
                      </Button>
                      <Box px={2}>
                        <CloseButton
                          color={
                            regRoom === roomItem.room_name ? "red" : "white"
                          }
                          onClick={() => deleteRoom(roomItem.room_name)}
                        />
                      </Box>
                    </Flex>
                  ))}
              </Flex>
            </Flex>
          </GridItem>
          <GridItem rowSpan={5} colSpan={3} minH="100%" bgColor="gray.800">
            <Flex flexDir="column">
              <Flex flexDir="ROW" gap={1} p={2} alignSelf="flex-end">
                {activeUsers &&
                  activeUsers.map((user) => (
                    <Text
                      key={user.username}
                      color={
                        user.username === regUsername ? "blue.300" : "white"
                      }
                    >
                      {user.username}
                    </Text>
                  ))}
              </Flex>
              <Flex
                minH="100%"
                flexDir="column"
                overflowY="scroll"
                css={{
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}
              >
                {messages &&
                  messages.map((message) => (
                    <Flex
                      key={message.id}
                      flexDir="row"
                      justifyContent="space-between"
                      border="1px solid purple"
                      bgColor={`#${message.randomColor}`}
                      bgGradient="revert"
                      borderRadius={6}
                      py={1}
                      pl={4}
                      pr={2}
                      overflowWrap="break-word"
                      color="white"
                    >
                      <Flex flexDir="column" alignItems="center">
                        <Text color="blue.300" alignSelf="flex-start">
                          {message.time}
                        </Text>
                        <Emoji text={message.message} />
                      </Flex>
                      <Flex gap={2} alignItems="center">
                        <Text>{message.username}</Text>
                        <Image
                          src={message.avatar}
                          boxSize={10}
                          rounded="full"
                        />
                      </Flex>
                    </Flex>
                  ))}
                <Box ref={scrollRef}></Box>
                <Text
                  color="gray.300"
                  alignSelf="center"
                  borderTop="5px solid #1A202C"
                >
                  {typing}
                </Text>
                <Flex
                  flexDir="row"
                  alignItems="flex-end"
                  bgColor="#1A202C"
                  border="20px solid #1A202C"
                  borderTop="5px solid #1A202C"
                >
                  <Textarea
                    onFocus={() => handleTyping(true)}
                    onBlur={() => handleTyping(false)}
                    width="100%"
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    variant="outline"
                    bg="gray.700"
                    color="white"
                    value={message}
                    fontSize="lg"
                    border="none"
                    borderRadius="none"
                    _focus={{
                      border: "1px solid black",
                    }}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleMessage(message);
                        setMessage("");
                      }
                    }}
                  />
                  <Box p={1}>
                    <MdSend
                      onMouseOver={({ target }) =>
                        (target.style.color = "#25D366")
                      }
                      onMouseOut={({ target }) =>
                        (target.style.color = "#48BB78")
                      }
                      // color="#25D366"
                      size={40}
                      onClick={() => {
                        handleMessage(message);
                        setMessage("");
                      }}
                    />
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          </GridItem>
        </Grid>
      </Center>
    </div>
  );
}

export default App;
