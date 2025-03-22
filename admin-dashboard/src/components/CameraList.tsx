import { Box, Heading, Text, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, Switch, HStack, Button, SimpleGrid } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Camera {
  id: string
  name: string
  location: string
  type: string
  status: string
  simulating?: boolean
}

interface Log {
  timestamp: string
  event: string
  result: string
}

interface CameraListProps {
  onAddClick: () => void;
}

export default function CameraList({ onAddClick }: CameraListProps) {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [logs, setLogs] = useState<Record<string, Log[]>>({})
  const [openItems, setOpenItems] = useState<string[]>([])

  const fetchCameras = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras`)
      // Get simulation status for each camera
      const camerasWithStatus = await Promise.all(
        response.data.map(async (camera: Camera) => {
          const simStatus = await axios.get(
            `${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${camera.id}/simulation-status`
          )
          return { ...camera, simulating: simStatus.data.simulating }
        })
      )
      setCameras(camerasWithStatus)
    } catch (error) {
      console.error('Failed to fetch cameras:', error)
    }
  }

  const fetchLogs = async (cameraId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/logs`)
      setLogs(prev => ({...prev, [cameraId]: response.data}))
    } catch (error) {
      console.error(`Failed to fetch logs for camera ${cameraId}:`, error)
    }
  }

  const toggleSimulation = async (cameraId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/simulate`)
      fetchCameras() // Refresh camera list
    } catch (error) {
      console.error(`Failed to toggle simulation for camera ${cameraId}:`, error)
    }
  }

  const clearCameraLogs = async (cameraId: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/logs`)
      setLogs(prev => ({...prev, [cameraId]: []}))
    } catch (error) {
      console.error(`Failed to clear logs for camera ${cameraId}:`, error)
    }
  }

  useEffect(() => {
    fetchCameras()
    const interval = setInterval(fetchCameras, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch logs for all open items
    const fetchOpenLogs = async () => {
      for (const cameraId of openItems) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras/${cameraId}/logs`)
          setLogs(prev => ({...prev, [cameraId]: response.data}))
        } catch (error) {
          console.error(`Failed to fetch logs for camera ${cameraId}:`, error)
        }
      }
    }

    // Initial fetch and setup interval
    fetchOpenLogs()
    const logInterval = setInterval(fetchOpenLogs, 2000)  // Update logs every 2 seconds

    return () => clearInterval(logInterval)
  }, [openItems])

  const handleAccordionChange = (cameraId: string) => {
    setOpenItems(prev => 
      prev.includes(cameraId) 
        ? prev.filter(id => id !== cameraId)
        : [...prev, cameraId]
    )
  }

  return (
    <Box p={5}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Monitoring Cameras</Heading>
        <Button colorScheme="blue" onClick={onAddClick}>
          Add Camera
        </Button>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {cameras.map((camera) => (
          <Box key={camera.id} borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Box p={4} bg="white">
              <HStack justify="space-between" mb={2}>
                <Box>
                  <Text fontWeight="bold">{camera.name}</Text>
                  <Badge mr={2}>{camera.type}</Badge>
                  <Text fontSize="sm" color="gray.500">{camera.location}</Text>
                </Box>
                <Switch
                  isChecked={camera.simulating}
                  onChange={() => toggleSimulation(camera.id)}
                  colorScheme="green"
                />
              </HStack>
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton 
                    px={0}
                    onClick={() => {
                      if (!openItems.includes(camera.id)) {
                        setOpenItems(prev => [...prev, camera.id]);
                        fetchLogs(camera.id);
                      } else {
                        setOpenItems(prev => prev.filter(id => id !== camera.id));
                      }
                    }}
                  >
                    <Text fontSize="sm" fontWeight="medium">
                      View Logs
                    </Text>
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontSize="sm" fontWeight="bold">Camera Logs</Text>
                      <Button 
                        size="xs" 
                        colorScheme="red" 
                        onClick={() => clearCameraLogs(camera.id)}
                        isDisabled={!logs[camera.id]?.length}
                      >
                        Clear Logs
                      </Button>
                    </HStack>
                    <Box maxHeight="200px" overflowY="auto">
                      {logs[camera.id]?.map((log, index) => (
                        <Box key={index} p={2} borderBottomWidth="1px">
                          <Text fontSize="sm">{new Date(log.timestamp).toLocaleString()}</Text>
                          <Text>{log.event}: {log.result}</Text>
                        </Box>
                      ))}
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
